import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ensureCertificateFonts } from "./pdfFonts";

ensureCertificateFonts();

interface Props {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  issueDate: string;
  durationHours: number;
  mentorName: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    fontFamily: "Vazirmatn",
    direction: "rtl",
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: "3px double #D4A017",
    borderRadius: 8,
  },
  innerBorder: {
    position: "absolute",
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    border: "1px solid #D4A01740",
    borderRadius: 6,
  },
  header: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A5F",
    marginBottom: 8,
    direction: "ltr",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  body: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 10,
  },
  name: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 10,
  },
  courseLabel: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E3A5F",
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: "#64748b",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 40,
  },
  footerItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E3A5F",
  },
  certNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E3A5F",
    fontFamily: "Vazirmatn",
    direction: "ltr",
  },
  line: {
    width: 120,
    height: 1,
    backgroundColor: "#1E3A5F",
    marginBottom: 8,
  },
});

export function CertificatePdfDocument({
  studentName,
  courseTitle,
  certificateNumber,
  issueDate,
  durationHours,
  mentorName,
}: Props) {
  const dateStr = new Date(issueDate).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.header}>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.subtitle}>گواهی‌نامه پایان دوره</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>این گواهی‌نامه به</Text>
          <Text style={styles.name}>{studentName}</Text>
          <Text style={styles.courseLabel}>مبنی بر گذراندن موفقیت‌آمیز دوره‌ی</Text>
          <Text style={styles.courseName}>{courseTitle}</Text>
          <Text style={styles.duration}>به مدت {durationHours} ساعت آموزش تخصصی</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <View style={styles.line} />
            <Text style={styles.footerLabel}>استاد دوره</Text>
            <Text style={styles.footerValue}>{mentorName}</Text>
          </View>

          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>شماره گواهی‌نامه</Text>
            <Text style={styles.certNumber}>{certificateNumber}</Text>
          </View>

          <View style={styles.footerItem}>
            <Text style={styles.footerValue}>{dateStr}</Text>
            <View style={styles.line} />
            <Text style={styles.footerLabel}>تاریخ صدور</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
