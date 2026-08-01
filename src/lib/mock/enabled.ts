function isProductionBuildUnderTest() {
  return process.env.E2E_MOCKS === "true" && !process.env.VERCEL_ENV;
}

export function isMockThirdParty() {
  const enabled = process.env.MOCK_THIRD_PARTY === "true";
  if (
    enabled &&
    process.env.NODE_ENV === "production" &&
    !isProductionBuildUnderTest()
  ) {
    throw new Error("MOCK_THIRD_PARTY cannot be enabled in production");
  }
  return enabled;
}

export const MOCK_OTP_CODE = "000000";
export const MOCK_STORAGE_BUCKET = "property-files";
