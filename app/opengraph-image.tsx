import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Travel Unbounded — handpicked journeys across India and beyond";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#c1552c",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#f7f4ec",
            display: "flex",
          }}
        >
          Travel Unbounded
        </div>
      </div>
    ),
    { ...size },
  );
}