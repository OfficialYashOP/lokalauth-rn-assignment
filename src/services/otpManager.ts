import AsyncStorage from '@react-native-async-storage/async-storage';
import { OtpRecord, OtpValidationResult } from '../types/auth';

const OTP_STORE_KEY = '@lokal_otp_store';
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 60_000;
const MAX_ATTEMPTS = 3;

type OtpStore = Record<string, OtpRecord>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const maxExclusive = 10 ** OTP_LENGTH;
  const code = Math.floor(min + Math.random() * (maxExclusive - min));
  return code.toString().padStart(OTP_LENGTH, '0');
}

async function readStore(): Promise<OtpStore> {
  try {
    const json = await AsyncStorage.getItem(OTP_STORE_KEY);
    const parsed = json ? (JSON.parse(json) as OtpStore) : {};
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeStore(store: OtpStore): Promise<void> {
  await AsyncStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
}

export async function generateOtp(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const otp = createOtpCode();
  const store = await readStore();

  store[normalizedEmail] = {
    otp,
    email: normalizedEmail,
    attempts: 0,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  };

  await writeStore(store);
  return otp;
}

export async function validateOtp(
  email: string,
  inputOtp: string
): Promise<OtpValidationResult> {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const record = store[normalizedEmail];

  if (!record) {
    return { success: false, error: 'not_found', remainingAttempts: 0 };
  }

  if (Date.now() >= record.expiresAt) {
    delete store[normalizedEmail];
    await writeStore(store);
    return { success: false, error: 'expired', remainingAttempts: 0 };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'max_attempts', remainingAttempts: 0 };
  }

  if (record.otp !== inputOtp) {
    record.attempts += 1;
    await writeStore(store);

    const remaining = MAX_ATTEMPTS - record.attempts;
    if (remaining <= 0) {
      return { success: false, error: 'max_attempts', remainingAttempts: 0 };
    }

    return { success: false, error: 'invalid', remainingAttempts: remaining };
  }

  delete store[normalizedEmail];
  await writeStore(store);
  return { success: true };
}

export async function getRemainingTime(email: string): Promise<number> {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const record = store[normalizedEmail];

  if (!record) return 0;

  const remainingMs = record.expiresAt - Date.now();
  if (remainingMs <= 0) {
    delete store[normalizedEmail];
    await writeStore(store);
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

export async function clearOtp(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  if (!store[normalizedEmail]) return;

  delete store[normalizedEmail];
  await writeStore(store);
}
