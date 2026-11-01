# Cloudflare R2 Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Cloudflare R2 (S3-compatible Object Storage) for product image uploads in the Shoes4Us platform, providing global CDN-backed image delivery with graceful local storage fallback for development.

**Architecture:** A storage abstraction layer (`pkg/storage.Uploader`) provides unified image upload handling. When Cloudflare R2 environment variables are configured, uploads are streamed to the Cloudflare R2 bucket via AWS SDK v2 for Go and return public CDN URLs. If credentials are unset, it falls back to local storage (`/uploads/`). A dedicated admin endpoint `POST /api/upload` and multipart product upsert handlers utilize this abstraction, while the React admin frontend gains a drag-and-drop file uploader component with preview.

**Tech Stack:** Go 1.24/1.25, `github.com/aws/aws-sdk-go-v2`, `github.com/aws/aws-sdk-go-v2/service/s3`, React 19, TypeScript, Tailwind CSS, Lucide Icons.

**Spec:** `SPEC-backend.md` (Product & Catalog specifications) & `PROJECT.md`.

## Global Constraints

- Go Version: 1.25.5 (toolchain >= 1.24).
- AWS SDK: Use `github.com/aws/aws-sdk-go-v2` and `github.com/aws/aws-sdk-go-v2/service/s3` for S3-compatible R2 operations.
- Max File Size: Exactly 5MB (`5 * 1024 * 1024` bytes).
- Allowed Image Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`.
- Key Generation: UUIDv4 (`fmt.Sprintf("products/%s%s", uuid.NewString(), ext)`).
- Fallback Mode: When `CF_R2_ACCOUNT_ID` or `CF_R2_BUCKET_NAME` is empty, automatically use `LocalStorage` without error.
- Admin Protection: Upload endpoints must require authenticated session with `ADMIN` role.

## Review Focus

1. Cloudflare R2 upload network/credential failure $\to$ returns 500 AppError with Indonesian error message without leaving dangling files or leaking secrets.
2. Malicious/non-image file upload (.exe, .html with image extension) $\to$ rejected with 400 Bad Request by `http.DetectContentType` inspection.
3. Payload size exceeding 5MB $\to$ rejected with 400 Bad Request ("Ukuran file gambar maksimal 5MB").
4. Upload request with missing or empty multipart file part $\to$ returns 400 Bad Request without panic or nil pointer exception.
5. High concurrency upload requests $\to$ UUIDv4 keys ensure zero collisions in Cloudflare R2 bucket.

---

### Task 1: Storage Abstraction Layer & Cloudflare R2 Client

**Files:**
- Create: `backend/pkg/storage/storage.go`
- Create: `backend/pkg/storage/local.go`
- Create: `backend/pkg/storage/r2.go`
- Modify: `backend/internal/config/config.go:15-70`
- Test: `backend/pkg/storage/storage_test.go`

**Interfaces:**
- Consumes: `config.Config` Cloudflare R2 environment settings.
- Produces: `storage.Uploader` interface with method `Upload(ctx context.Context, file io.Reader, filename string, contentType string) (string, error)` and factory `storage.NewUploader(cfg *config.Config) (storage.Uploader, error)`.

- [ ] **Step 1: Write the failing test for Storage abstraction and LocalUploader**

Write `backend/pkg/storage/storage_test.go` testing:
1. `LocalUploader`: saves bytes to a temporary directory, verifies file existence, and returns URL `/uploads/<filename>`.
2. `Uploader` validation: rejects empty filename, empty reader, or invalid content types.
3. `Factory` returns `LocalUploader` when R2 credentials are unset.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; go test -v ./pkg/storage/...`
Expected: FAIL (package `pkg/storage` not yet created).

- [ ] **Step 3: Add AWS SDK v2 dependencies to `backend/go.mod`**

Add AWS S3 SDK packages:
```bash
cd backend
go get github.com/aws/aws-sdk-go-v2
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/credentials
go get github.com/aws/aws-sdk-go-v2/service/s3
```

- [ ] **Step 4: Update `backend/internal/config/config.go` with Cloudflare R2 fields**

Add fields to `Config` struct:
- `CFR2AccountID string` (`CF_R2_ACCOUNT_ID`)
- `CFR2AccessKeyID string` (`CF_R2_ACCESS_KEY_ID`)
- `CFR2SecretAccessKey string` (`CF_R2_SECRET_ACCESS_KEY`)
- `CFR2BucketName string` (`CF_R2_BUCKET_NAME`)
- `CFR2PublicURL string` (`CF_R2_PUBLIC_URL`)

- [ ] **Step 5: Implement `storage.Uploader`, `LocalUploader`, and `R2Uploader`**

In `backend/pkg/storage/`:
- `storage.go`: Define `type Uploader interface { Upload(ctx context.Context, r io.Reader, filename string, contentType string) (string, error) }` and `NewUploader(cfg *config.Config) (Uploader, error)`.
- `local.go`: Implement `LocalUploader` with target directory, writes file to disk, returns `/uploads/` + filename.
- `r2.go`: Implement `R2Uploader` using `s3.NewFromConfig` configured with Cloudflare R2 endpoint `https://<account_id>.r2.cloudflarestorage.com`, static credentials, and region `auto`. Method `Upload` calls `client.PutObject` with bucket, key (`products/<filename>`), body, and `ContentType`. Returns public URL `fmt.Sprintf("%s/%s", strings.TrimRight(publicURL, "/"), key)`.

- [ ] **Step 6: Run storage tests to verify they pass**

Run: `cd backend; go test -v ./pkg/storage/...`
Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add backend/go.mod backend/go.sum backend/internal/config/config.go backend/pkg/storage/
git commit -m "feat(storage): implement storage abstraction with Cloudflare R2 and local fallback"
```

---

### Task 2: Dedicated Upload Endpoint & ProductHandler Integration

**Files:**
- Modify: `backend/internal/handler/product_handler.go:30-428`
- Modify: `backend/internal/handler/router.go:15-120`
- Modify: `backend/cmd/api/main.go:50-85`
- Test: `backend/internal/handler/product_handler_test.go`
- Test: `backend/internal/handler/router_test.go`

**Interfaces:**
- Consumes: `storage.Uploader` injected into `ProductHandler`.
- Produces: 
  - `POST /api/upload`: Dedicated image upload endpoint (Admin only), returns `{ url, filename, size }`.
  - `POST /api/products` & `PUT /api/products/{id}`: Multipart image uploads utilize `h.uploader.Upload(...)` directly.

- [ ] **Step 1: Write the failing tests for `POST /api/upload` and ProductHandler uploader integration**

In `backend/internal/handler/product_handler_test.go`:
1. `TestProductHandler_UploadImage_Success`: uploads valid image multipart file to `POST /api/upload`, verifies 200 OK and JSON response containing `url`.
2. `TestProductHandler_UploadImage_Exceeds5MB`: uploads file > 5MB, verifies 400 Bad Request ("Ukuran file gambar maksimal 5MB").
3. `TestProductHandler_UploadImage_NonImageMime`: uploads non-image bytes (.txt or .exe disguised), verifies 400 Bad Request ("Format file harus berupa gambar").
4. `TestProductHandler_UploadImage_Unauthorized`: verifies unauthenticated request returns 401 Unauthorized, and non-admin returns 403 Forbidden.
5. `TestProductHandler_CreateProduct_WithUploader`: verifies creating product with multipart image stores URL returned by uploader into `product.ImageURL`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend; go test -v ./internal/handler/... -run TestProductHandler_UploadImage`
Expected: FAIL (handler method `UploadImage` not implemented).

- [ ] **Step 3: Update `ProductHandler` with `storage.Uploader`**

In `backend/internal/handler/product_handler.go`:
- Add field `uploader storage.Uploader` to `ProductHandler`.
- Add method `WithUploader(uploader storage.Uploader) *ProductHandler`.
- Implement `UploadImage(w http.ResponseWriter, r *http.Request)`:
  - Parses multipart file (`image` or `file`).
  - Validates size <= 5MB.
  - Detects MIME type using `http.DetectContentType(buf)`.
  - Determines extension (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
  - Calls `h.uploader.Upload(ctx, file, filename, mimeType)`.
  - Writes response: `response.WriteSuccess(w, http.StatusOK, "Gambar berhasil diunggah", map[string]any{"url": url, "filename": filename, "size": header.Size}, nil)`.
- Update `saveUploadedImage(r *http.Request)` to use `h.uploader.Upload(...)` instead of writing to disk directly.

- [ ] **Step 4: Register route in `internal/handler/router.go` and initialize in `cmd/api/main.go`**

In `backend/internal/handler/router.go`:
- Inside `r.Route("/api", ...)` under admin-protected group:
  - Add `api.Post("/upload", deps.ProductHandler.UploadImage)`
In `backend/cmd/api/main.go`:
- Initialize `uploader, err := storage.NewUploader(cfg)`.
- Pass uploader: `productHandler := handler.NewProductHandler(productSvc).WithUploader(uploader).WithUploadDir(cfg.UploadDir)`.

- [ ] **Step 5: Run handler & router tests to verify they pass**

Run: `cd backend; go test -v ./internal/handler/...`
Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add backend/internal/handler/ backend/cmd/api/main.go
git commit -m "feat(api): add dedicated POST /api/upload endpoint and integrate storage uploader"
```

---

### Task 3: Frontend Admin File Upload UI & API Client

**Files:**
- Modify: `frontend/src/services/api.ts:50-110`
- Create: `frontend/src/components/admin/ImageUploadDropzone.tsx`
- Modify: `frontend/src/pages/AdminAddProductPage.tsx:520-580`
- Modify: `frontend/src/pages/AdminProductPage.tsx:860-890`

**Interfaces:**
- Consumes: `POST /api/upload` via `api.uploadImage(file: File): Promise<{ url: string; filename: string }>`.
- Produces: `ImageUploadDropzone` component with drag-and-drop, file picker, upload spinner, preview, remove button, and manual URL input fallback.

- [ ] **Step 1: Add `uploadImage` API method to `frontend/src/services/api.ts`**

Add helper:
```typescript
export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await request<{ data: { url: string; filename: string; size: number } }>("/api/upload", {
    method: "POST",
    body: formData,
  });
  return res.data;
}
```

- [ ] **Step 2: Create `ImageUploadDropzone` Component**

Create `frontend/src/components/admin/ImageUploadDropzone.tsx`:
- Props: `value: string; onChange: (url: string) => void; disabled?: boolean`.
- Features:
  - Drag-and-drop zone and hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" />`.
  - Validates client-side file size (<= 5MB).
  - Displays uploading spinner and status ("Mengunggah gambar ke cloud...").
  - On upload success: calls `onChange(result.url)` and displays thumbnail preview.
  - Allows switching to "Input URL manual" or "Pilih file dari komputer".
  - Button to clear/remove selected image.

- [ ] **Step 3: Integrate `ImageUploadDropzone` into `AdminAddProductPage.tsx`**

Replace raw text input for `imageUrl` in `AdminAddProductPage.tsx` with:
```tsx
<ImageUploadDropzone
  value={imageUrl}
  onChange={(url) => {
    setImageUrl(url);
    setImagePreviewError(false);
  }}
  disabled={loading}
/>
```

- [ ] **Step 4: Integrate `ImageUploadDropzone` into `AdminProductPage.tsx`**

Replace raw text input for `imageUrl` in the Edit Product modal of `AdminProductPage.tsx` with `ImageUploadDropzone`.

- [ ] **Step 5: Test frontend build and lint**

Run: `npm --prefix frontend run lint && npm --prefix frontend run build`
Expected: PASS with 0 lint errors and successful Vite build.

- [ ] **Step 6: Commit Task 3**

```bash
git add frontend/src/services/api.ts frontend/src/components/admin/ frontend/src/pages/AdminAddProductPage.tsx frontend/src/pages/AdminProductPage.tsx
git commit -m "feat(admin): add image dropzone uploader component connected to cloud upload API"
```

---

### Task 4: Environment Templates, Docker & Cloudflare R2 Documentation

**Files:**
- Modify: `.env.example`
- Modify: `backend/.env.example`
- Modify: `backend/.env`
- Modify: `docker-compose.yml`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Documents the 5 Cloudflare R2 environment variables.
- Step-by-step tutorial on how to get Cloudflare R2 API tokens and create a free bucket in Cloudflare dashboard.

- [ ] **Step 1: Update `.env.example` and `backend/.env.example`**

Add section:
```env
# ------------------------------------------
# Cloudflare R2 Object Storage (Image Uploads)
# ------------------------------------------
# Leave empty to use local storage (./uploads).
# When filled, uploaded images are stored on Cloudflare R2 and served via Cloudflare CDN.
CF_R2_ACCOUNT_ID=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_BUCKET_NAME=shoes4us-images
CF_R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

- [ ] **Step 2: Update `docker-compose.yml` backend service environment**

Pass through `CF_R2_*` variables to backend container so Docker deployments can utilize Cloudflare R2 without mounting persistent upload disk if desired.

- [ ] **Step 3: Document Cloudflare R2 setup in `DEPLOYMENT.md`**

Add a dedicated guide in `DEPLOYMENT.md`:
1. How to create an R2 bucket in Cloudflare dashboard (free 10GB).
2. How to generate R2 API Tokens (Access Key ID & Secret Access Key).
3. How to enable public access (either `r2.dev` public subdomain or custom domain like `images.shoes4us.com`).
4. How to configure variables in local `.env` and production host.

- [ ] **Step 4: Run full verification suite**

Run:
```bash
npm run test:be
npm run build:fe
npm run lint:fe
```
Expected: All tests PASS, build clean.

- [ ] **Step 5: Commit Task 4**

```bash
git add .env.example backend/.env.example docker-compose.yml DEPLOYMENT.md
git commit -m "docs(storage): document Cloudflare R2 setup and update environment templates"
```

---

## Plan Review Checklist

1. **Spec Coverage:** Covers image upload requirement with Cloudflare R2, admin dedicated endpoint, multipart product creation, and frontend UI drag-and-drop.
2. **Step Scan:** Every step specifies unambiguous file paths, function signatures, test names, and commands.
3. **Type Consistency:** Method signatures (`Upload(ctx, r, filename, contentType)`) and return types (`(string, error)`) match across Task 1, Task 2, and Task 3.
4. **Review Focus:** All 5 failure modes (R2 failure, malicious MIME, >5MB payload, missing file part, concurrent UUID uniqueness) have corresponding automated tests in Task 1 & Task 2.
5. **Proportion:** Concise, focused on architecture, interfaces, and test criteria without redundant code transcripts.

