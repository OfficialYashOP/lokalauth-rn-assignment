export type RootStackParamList = {
  Login: undefined;
  Otp: { email: string };
  Session: { email: string; loginTime: number };
};
