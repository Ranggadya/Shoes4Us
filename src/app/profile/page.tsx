"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleEditClick = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Gagal memperbarui profil");
      }

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
      await refresh(); // Refresh user data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field password wajib diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Gagal mengubah password");
      }

      toast.success("Password berhasil diubah!");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Memuat profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">
          Silakan login untuk melihat informasi profil Anda.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex justify-center items-center py-8"
      style={{ backgroundImage: "url('/sepatu1.jpeg')" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Profil Pengguna</h1>
          {!isEditing && !showChangePassword && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit2 size={16} />
              Edit
            </button>
          )}
        </div>

        {/* Profile Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-1">Nama Lengkap</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama lengkap"
              />
            ) : (
              <input
                type="text"
                value={user.name}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
              />
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan email"
              />
            ) : (
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
              />
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Peran</label>
            <input
              value={user.role === "ADMIN" ? "Admin" : "Pengguna"}
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-700"
            />
          </div>
        </div>

        {/* Edit Profile Actions */}
        {isEditing && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <X size={16} />
              Batal
            </button>
          </div>
        )}

        {/* Change Password Section */}
        {!isEditing && (
          <div className="border-t pt-6">
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Ubah Password
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Ubah Password</h3>
                
                <div>
                  <label className="block text-gray-700 mb-1">Password Saat Ini</label>
                  <div className="flex items-center">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Password Baru</label>
                  <div className="flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Konfirmasi Password Baru</label>
                  <div className="flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r hover:bg-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? "Menyimpan..." : "Simpan Password"}
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
