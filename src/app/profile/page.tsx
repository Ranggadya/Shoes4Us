"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  PackageSearch,
  Ruler,
  Save,
  ShieldCheck,
  Star,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

type ProfileTab = "account" | "profile" | "address";

type AddressForm = {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type AccountPreferences = {
  defaultSize: string;
  favoriteBrand: string;
  emailOffers: boolean;
  orderSms: boolean;
};

const emptyAddress: AddressForm = {
  label: "Rumah",
  recipient: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

const defaultPreferences: AccountPreferences = {
  defaultSize: "",
  favoriteBrand: "",
  emailOffers: true,
  orderSms: true,
};

const tabs: Array<{
  id: ProfileTab;
  label: string;
  icon: typeof User;
}> = [
  { id: "account", label: "Account", icon: ShieldCheck },
  { id: "profile", label: "Profile Saya", icon: User },
  { id: "address", label: "My Address", icon: MapPin },
];

export default function ProfilePage() {
  const { user, token, isLoading, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [preferences, setPreferences] =
    useState<AccountPreferences>(defaultPreferences);
  const [savingAddress, setSavingAddress] = useState(false);

  const storageKey = useMemo(
    () => (user ? `shoes4us-address-${user.id}` : "shoes4us-address"),
    [user]
  );

  const preferencesKey = useMemo(
    () => (user ? `shoes4us-preferences-${user.id}` : "shoes4us-preferences"),
    [user]
  );

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);

    const savedAddress = window.localStorage.getItem(storageKey);
    if (savedAddress) {
      setAddress({ ...emptyAddress, ...JSON.parse(savedAddress) });
    } else {
      setAddress((current) => ({
        ...current,
        recipient: user.name,
      }));
    }

    const savedPreferences = window.localStorage.getItem(preferencesKey);
    if (savedPreferences) {
      setPreferences({
        ...defaultPreferences,
        ...JSON.parse(savedPreferences),
      });
    }
  }, [preferencesKey, storageKey, user]);

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resetProfileForm = () => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
  };

  const handleCancelProfileEdit = () => {
    resetProfileForm();
    setIsEditingProfile(false);
  };

  const handleCancelAccountEdit = () => {
    resetProfileForm();
    setIsEditingAccount(false);
  };

  const saveAccountDetails = async () => {
    if (!user) return;

    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders,
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message ?? "Gagal memperbarui akun");
      }

      toast.success("Data akun berhasil diperbarui");
      setIsEditingProfile(false);
      setIsEditingAccount(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveAccountDetails();
  };

  const handleSaveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveAccountDetails();
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Lengkapi semua field password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        credentials: "include",
        headers: authHeaders,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message ?? "Gagal memperbarui password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingPreferences(true);
    window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    setTimeout(() => {
      setSavingPreferences(false);
      toast.success("Preferensi akun berhasil disimpan");
    }, 250);
  };

  const handleSaveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!address.recipient || !address.phone || !address.address || !address.city) {
      toast.error("Lengkapi nama penerima, telepon, alamat, dan kota");
      return;
    }

    setSavingAddress(true);
    window.localStorage.setItem(storageKey, JSON.stringify(address));
    setTimeout(() => {
      setSavingAddress(false);
      toast.success("Alamat berhasil disimpan");
    }, 250);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Memuat profil...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <User className="w-14 h-14 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Login Diperlukan
          </h1>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses halaman profile Anda.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">
            Kelola akun, keamanan login, profile, dan alamat pengiriman Anda.
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-lg p-3 h-fit">
            <div className="px-3 py-4 border-b border-gray-100 mb-2">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold mb-3">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <p className="font-semibold text-gray-900 line-clamp-1">
                {user.name}
              </p>
              <p className="text-sm text-gray-500 line-clamp-1">{user.email}</p>
            </div>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition ${
                      selected
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-5">
            {activeTab === "account" && (
              <>
                <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Account
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Edit informasi login dan akses cepat aktivitas belanja.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
                      <BadgeCheck className="w-4 h-4" />
                      Aktif
                    </span>
                  </div>

                  <form onSubmit={handleSaveAccount} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nama Akun
                        </label>
                        <input
                          value={isEditingAccount ? name : user.name}
                          onChange={(event) => setName(event.target.value)}
                          readOnly={!isEditingAccount}
                          className={`w-full px-4 py-3 border rounded-lg ${
                            isEditingAccount
                              ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                              : "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Login
                        </label>
                        <input
                          type="email"
                          value={isEditingAccount ? email : user.email}
                          onChange={(event) => setEmail(event.target.value)}
                          readOnly={!isEditingAccount}
                          className={`w-full px-4 py-3 border rounded-lg ${
                            isEditingAccount
                              ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                              : "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tipe Akun
                        </label>
                        <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          {user.role === "ADMIN" ? "Admin" : "Customer"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status Login
                        </label>
                        <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password aktif
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {isEditingAccount ? (
                        <>
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                          >
                            <Save className="w-5 h-5" />
                            {savingProfile ? "Menyimpan..." : "Simpan Account"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAccountEdit}
                            disabled={savingProfile}
                            className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
                          >
                            <X className="w-5 h-5" />
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingAccount(true)}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                        >
                          <User className="w-5 h-5" />
                          Edit Account
                        </button>
                      )}

                      <Link
                        href="/status-pesanan"
                        className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50 transition"
                      >
                        <PackageSearch className="w-5 h-5" />
                        Lacak Pesanan
                      </Link>
                    </div>
                  </form>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-gray-900">
                      Keamanan Account
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Ubah password secara aman dengan verifikasi password lama.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswordFields ? "text" : "password"}
                            value={currentPassword}
                            onChange={(event) =>
                              setCurrentPassword(event.target.value)
                            }
                            className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswordFields((current) => !current)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                            aria-label={
                              showPasswordFields
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                          >
                            {showPasswordFields ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password Baru
                        </label>
                        <input
                          type={showPasswordFields ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <PasswordStrengthMeter
                          password={newPassword}
                          showRequirements={false}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Konfirmasi Password
                        </label>
                        <input
                          type={showPasswordFields ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                    >
                      <KeyRound className="w-5 h-5" />
                      {savingPassword ? "Memperbarui..." : "Ubah Password"}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-gray-900">
                      Preferensi Belanja
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Simpan ukuran dan preferensi komunikasi untuk pengalaman belanja yang lebih cepat.
                    </p>
                  </div>

                  <form onSubmit={handleSavePreferences} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ukuran Sepatu Default
                        </label>
                        <div className="relative">
                          <Ruler className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <select
                            value={preferences.defaultSize}
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                defaultSize: event.target.value,
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value="">Pilih ukuran</option>
                            {["38", "39", "40", "41", "42", "43", "44", "45"].map(
                              (size) => (
                                <option key={size} value={size}>
                                  EU {size}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Brand Favorit
                        </label>
                        <div className="relative">
                          <Star className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            value={preferences.favoriteBrand}
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                favoriteBrand: event.target.value,
                              }))
                            }
                            placeholder="Nike, Adidas, Puma..."
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition">
                        <span className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-500" />
                          <span>
                            <span className="block font-semibold text-gray-900">
                              Email promo dan rilis terbaru
                            </span>
                            <span className="block text-sm text-gray-500">
                              Info diskon, launch sepatu, dan rekomendasi produk.
                            </span>
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.emailOffers}
                          onChange={(event) =>
                            setPreferences((current) => ({
                              ...current,
                              emailOffers: event.target.checked,
                            }))
                          }
                          className="w-5 h-5 accent-black"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition">
                        <span className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-500" />
                          <span>
                            <span className="block font-semibold text-gray-900">
                              Update pesanan via SMS
                            </span>
                            <span className="block text-sm text-gray-500">
                              Notifikasi status checkout dan pengiriman.
                            </span>
                          </span>
                        </span>
                        <input
                          type="checkbox"
                          checked={preferences.orderSms}
                          onChange={(event) =>
                            setPreferences((current) => ({
                              ...current,
                              orderSms: event.target.checked,
                            }))
                          }
                          className="w-5 h-5 accent-black"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPreferences}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                    >
                      <Save className="w-5 h-5" />
                      {savingPreferences ? "Menyimpan..." : "Simpan Preferensi"}
                    </button>
                  </form>
                </div>
              </>
            )}

            {activeTab === "profile" && (
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Profile Saya
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Informasi dasar yang digunakan pada akun Anda.
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Lengkap
                      </label>
                      <input
                        value={isEditingProfile ? name : user.name}
                        onChange={(event) => setName(event.target.value)}
                        readOnly={!isEditingProfile}
                        className={`w-full px-4 py-3 border rounded-lg ${
                          isEditingProfile
                            ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={isEditingProfile ? email : user.email}
                        onChange={(event) => setEmail(event.target.value)}
                        readOnly={!isEditingProfile}
                        className={`w-full px-4 py-3 border rounded-lg ${
                          isEditingProfile
                            ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        value={user.role === "ADMIN" ? "Admin" : "User"}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Keamanan
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        Dikelola dari tab Account
                      </div>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
                      >
                        <Save className="w-5 h-5" />
                        {savingProfile ? "Menyimpan..." : "Simpan Profile"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProfileEdit}
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
                      >
                        <X className="w-5 h-5" />
                        Batal
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === "address" && (
              <div className="bg-white border border-gray-200 rounded-lg p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Address
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Alamat yang akan memudahkan proses checkout berikutnya.
                  </p>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Label Alamat
                      </label>
                      <input
                        value={address.label}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nama Penerima
                      </label>
                      <input
                        value={address.recipient}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            recipient: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <input
                        value={address.phone}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kota
                      </label>
                      <input
                        value={address.city}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kode Pos
                      </label>
                      <input
                        value={address.postalCode}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            postalCode: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alamat Lengkap
                      </label>
                      <textarea
                        value={address.address}
                        onChange={(event) =>
                          setAddress((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                  >
                    <Save className="w-5 h-5" />
                    {savingAddress ? "Menyimpan..." : "Simpan Alamat"}
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
