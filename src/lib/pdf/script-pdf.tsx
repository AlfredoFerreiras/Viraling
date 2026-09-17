import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { APP_NAME } from "@/lib/brand";

/**
 * Production guide PDF (block 7): the same layout and per section
 * colors as the UI. Generated on demand, never stored.
 */

const COLORS: Record<string, string> = {
  hook: "#fb7185", // rose
  context: "#38bdf8", // sky
  problem: "#fb923c", // orange
  solution: "#34d399", // emerald
  cta: "#fbbf24", // amber
  slide: "#38bdf8",
  slide_cta: "#fbbf24",
  story: "#a78bfa", // violet
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#fbbf24",
  },
  brand: { fontSize: 9, color: "#a1a1aa", marginBottom: 6 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: "#52525b" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#52525b",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    backgroundColor: "#fafafa",
  },
  timeCol: { width: 60 },
  time: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  spoken: { flex: 1, lineHeight: 1.4 },
  onScreen: { fontSize: 8, color: "#71717a", marginTop: 3 },
  coversRow: { flexDirection: "row", gap: 8 },
  cover: {
    flex: 1,
    backgroundColor: "#09090b",
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    justifyContent: "center",
  },
  coverWhite: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    textTransform: "uppercase",
  },
  coverYellow: {
    color: "#fbbf24",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
    textTransform: "uppercase",
  },
  caption: {
    lineHeight: 1.5,
    backgroundColor: "#fafafa",
    padding: 10,
    borderRadius: 6,
  },
  hashtags: { color: "#0284c7", marginTop: 6, lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
  },
});

type ReelSection = {
  section: string;
  time_start: number;
  time_end: number;
  spoken: string;
  on_screen: string[];
};
type CarouselSection = { slide: number; title: string; body: string; is_cta: boolean };
type StorySection = { story: number; purpose: string; spoken: string; on_screen: string[] };
type Cover = { white_text: string; yellow_text: string };

export type ScriptPdfData = {
  title: string;
  contentType: "reel" | "carousel" | "story";
  formatName: string | null;
  nicheName: string | null;
  sections: unknown;
  covers: Cover[] | null;
  caption: string | null;
  hashtags: string[] | null;
  labels: {
    sections: string;
    onScreen: string;
    covers: string;
    caption: string;
    hashtags: string;
    slide: string;
    story: string;
  };
};

export function ScriptPdf({ data }: { data: ScriptPdfData }) {
  const duration =
    data.contentType === "reel"
      ? `${Math.max(...(data.sections as ReelSection[]).map((s) => s.time_end))}s`
      : null;

  return (
    <Document title={data.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{APP_NAME} · Production guide</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.meta}>
            {[
              data.contentType.toUpperCase(),
              data.formatName,
              data.nicheName,
              duration,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>{data.labels.sections}</Text>

        {data.contentType === "reel" &&
          (data.sections as ReelSection[]).map((s, i) => (
            <View
              key={i}
              style={[styles.row, { borderLeftColor: COLORS[s.section] ?? "#a1a1aa" }]}
            >
              <View style={styles.timeCol}>
                <Text style={[styles.sectionName, { color: COLORS[s.section] }]}>
                  {s.section}
                </Text>
                <Text style={styles.time}>
                  {s.time_start}s–{s.time_end}s
                </Text>
              </View>
              <View style={styles.spoken}>
                <Text>{s.spoken}</Text>
                {s.on_screen.length > 0 && (
                  <Text style={styles.onScreen}>
                    {data.labels.onScreen}: {s.on_screen.join("  |  ")}
                  </Text>
                )}
              </View>
            </View>
          ))}

        {data.contentType === "carousel" &&
          (data.sections as CarouselSection[]).map((s, i) => (
            <View
              key={i}
              style={[
                styles.row,
                { borderLeftColor: s.is_cta ? COLORS.slide_cta : COLORS.slide },
              ]}
            >
              <View style={styles.timeCol}>
                <Text
                  style={[
                    styles.sectionName,
                    { color: s.is_cta ? COLORS.slide_cta : COLORS.slide },
                  ]}
                >
                  {data.labels.slide} {s.slide}
                  {s.is_cta ? " CTA" : ""}
                </Text>
              </View>
              <View style={styles.spoken}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{s.title}</Text>
                <Text>{s.body}</Text>
              </View>
            </View>
          ))}

        {data.contentType === "story" &&
          (data.sections as StorySection[]).map((s, i) => (
            <View key={i} style={[styles.row, { borderLeftColor: COLORS.story }]}>
              <View style={styles.timeCol}>
                <Text style={[styles.sectionName, { color: COLORS.story }]}>
                  {data.labels.story} {s.story}
                </Text>
                <Text style={{ fontSize: 8, color: "#71717a" }}>{s.purpose}</Text>
              </View>
              <View style={styles.spoken}>
                <Text>{s.spoken}</Text>
                {s.on_screen.length > 0 && (
                  <Text style={styles.onScreen}>
                    {data.labels.onScreen}: {s.on_screen.join("  |  ")}
                  </Text>
                )}
              </View>
            </View>
          ))}

        {data.covers && data.covers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{data.labels.covers}</Text>
            <View style={styles.coversRow}>
              {data.covers.map((c, i) => (
                <View key={i} style={styles.cover}>
                  <Text style={styles.coverWhite}>
                    {c.white_text}{" "}
                    <Text style={styles.coverYellow}>{c.yellow_text}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {data.caption && (
          <>
            <Text style={styles.sectionTitle}>{data.labels.caption}</Text>
            <View style={styles.caption}>
              <Text>{data.caption}</Text>
              {data.hashtags && data.hashtags.length > 0 && (
                <Text style={styles.hashtags}>{data.hashtags.join(" ")}</Text>
              )}
            </View>
          </>
        )}

        <Text style={styles.footer} fixed>
          {APP_NAME}
        </Text>
      </Page>
    </Document>
  );
}
