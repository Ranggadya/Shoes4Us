export interface PasswordStrength {
  label: string;
  color: string;
  percentage: number;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      label: "Kosong",
      color: "#d1d5db", // gray-300
      percentage: 0,
      feedback: ["Password belum diisi."],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push("Minimal 8 karakter");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Tambahkan huruf besar (A-Z)");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Tambahkan angka (0-9)");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Tambahkan karakter spesial (!@#$%)");

  // Tentukan hasil akhir
  if (score <= 1) {
    return {
      label: "Lemah",
      color: "#ef4444", // merah
      percentage: 25,
      feedback,
    };
  } else if (score === 2) {
    return {
      label: "Sedang",
      color: "#f59e0b", // kuning
      percentage: 50,
      feedback,
    };
  } else if (score === 3) {
    return {
      label: "Kuat",
      color: "#22c55e", // hijau
      percentage: 75,
      feedback,
    };
  } else {
    return {
      label: "Sangat Kuat",
      color: "#16a34a", // hijau tua
      percentage: 100,
      feedback: [],
    };
  }
}
