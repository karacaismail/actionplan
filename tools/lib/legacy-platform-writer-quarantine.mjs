export const LEGACY_PLATFORM_WRITERS = [
  "tools/gen-platform.mjs",
  "tools/gen-platform-content.mjs",
  "tools/gen-platform-meta.mjs",
];

export const LEGACY_PLATFORM_WRITER_MARKER = "LEGACY_PLATFORM_WRITER_BLOCKED";

export function inspectLegacyPlatformWriter(source, relativePath) {
  const errors = [];
  const guard = `blockLegacyPlatformWriter("${relativePath}");`;
  const guardIndex = source.indexOf(guard);
  const writeIndex = source.indexOf("writeFileSync");
  if (!source.includes("./lib/legacy-platform-writer-quarantine.mjs"))
    errors.push(`${relativePath}: quarantine import missing`);
  if (guardIndex < 0) errors.push(`${relativePath}: fail-closed guard missing`);
  if (writeIndex >= 0 && (guardIndex < 0 || guardIndex > writeIndex))
    errors.push(`${relativePath}: guard must run before canonical write`);
  return errors;
}

export function blockLegacyPlatformWriter(relativePath) {
  console.error(
    `[${LEGACY_PLATFORM_WRITER_MARKER}] ${relativePath} is archived and cannot write canonical data.`,
  );
  process.exit(2);
}
