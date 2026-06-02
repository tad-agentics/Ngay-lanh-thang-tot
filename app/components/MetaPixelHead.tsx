import {
  META_PIXEL_HEAD_SCRIPT,
  META_PIXEL_NOSCRIPT_IMG_URL,
  isMetaPixelRuntimeEnabled,
} from "~/lib/meta-pixel";

/** Meta Pixel base code in `<head>` (production only). */
export function MetaPixelHead() {
  if (!isMetaPixelRuntimeEnabled()) return null;

  return (
    <>
      {/* Meta Pixel Code */}
      <script
        dangerouslySetInnerHTML={{
          __html: META_PIXEL_HEAD_SCRIPT,
        }}
      />
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          alt=""
          src={META_PIXEL_NOSCRIPT_IMG_URL}
        />
      </noscript>
    </>
  );
}
