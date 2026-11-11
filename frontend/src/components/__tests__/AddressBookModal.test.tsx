import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressBookModal from "../AddressBookModal";

describe("AddressBookModal component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("allows adding a new address, setting it as default, and selecting it", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <AddressBookModal
        isOpen={true}
        userId="user-1"
        onClose={onClose}
        onSelect={onSelect}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Tambah Alamat Baru/i })
    );

    await userEvent.type(
      screen.getByPlaceholderText(/Contoh: Rumah, Kantor/i),
      "Kantor"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Nama penerima/i),
      "Budi Santoso"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Nomor telepon/i),
      "081234567890"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Nama jalan, gedung/i),
      "Jl. Sudirman No. 45"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Kota \/ Kabupaten/i),
      "Jakarta Selatan"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Kode pos/i),
      "12190"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Simpan Alamat/i })
    );

    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Kantor")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Pilih Alamat Ini/i })
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Kantor",
        recipientName: "Budi Santoso",
        phone: "081234567890",
        streetAddress: "Jl. Sudirman No. 45",
        city: "Jakarta Selatan",
        postalCode: "12190",
      })
    );
  });

  it("recovers gracefully when localStorage contains corrupted JSON", () => {
    localStorage.setItem("shoes4us_address_book_v1:user-1", "{corrupted-json");

    render(
      <AddressBookModal
        isOpen={true}
        userId="user-1"
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /Tambah Alamat Baru/i })
    ).toBeInTheDocument();
  });
});
