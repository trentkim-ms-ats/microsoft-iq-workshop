"use strict";

const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const ROOT = __dirname;
const OUT = path.join(ROOT, "generated");
const TABLE_WIDTH = 9026;
const COLORS = {
  navy: "17365D",
  blue: "2F75B5",
  lightBlue: "D9EAF7",
  gray: "F2F2F2",
  border: "B7C9DA",
  red: "C00000",
};

const CONTENT_DEFINITIONS_DIR = path.join(ROOT, "content_definitions");

function loadContentFile(fileName) {
  const targetPath = path.join(CONTENT_DEFINITIONS_DIR, fileName);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing content definition file: ${path.relative(ROOT, targetPath)}`);
  }
  const text = fs.readFileSync(targetPath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${path.relative(ROOT, targetPath)}: ${error.message}`);
  }
}

function loadContentDefinitions() {
  return {
    people: loadContentFile("people.json"),
    sharePointDocs: loadContentFile("sharepoint_docs.json"),
    oneDriveDocs: loadContentFile("onedrive_docs.json"),
    outlookMessages: loadContentFile("outlook_messages.json"),
    teamsThreads: loadContentFile("teams_threads.json"),
  };
}

const { people, sharePointDocs, oneDriveDocs, outlookMessages, teamsThreads } = loadContentDefinitions();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanOutput() {
  fs.rmSync(OUT, { recursive: true, force: true });
  [
    "sharepoint/Campaigns",
    "sharepoint/Operations",
    "sharepoint/Analytics",
    "sharepoint/DataQuality",
    "sharepoint/Leadership",
    "outlook",
    "teams",
    "onedrive/MeetingNotes",
    "onedrive/Briefings",
    "manifests",
  ].forEach((subdir) => ensureDir(path.join(OUT, subdir)));
}

function border() {
  return { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
}

function cell(text, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border(), bottom: border(), left: border(), right: border() },
    shading: options.header ? { fill: COLORS.lightBlue, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: Boolean(options.header),
            color: options.header ? COLORS.navy : "000000",
            font: "Arial",
            size: 19,
          }),
        ],
      }),
    ],
  });
}

function twoColumnTable(rows) {
  const widths = [2300, TABLE_WIDTH - 2300];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      ([key, value], index) =>
        new TableRow({
          children: [cell(key, widths[0], { header: index === 0 }), cell(value, widths[1], { header: index === 0 })],
        }),
    ),
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, font: "Arial", color: level === HeadingLevel.HEADING_1 ? COLORS.navy : COLORS.blue })],
  });
}

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 320 },
    numbering: options.bullet ? { reference: "bullets", level: 0 } : undefined,
    children: [new TextRun({ text, font: "Arial", size: 21, color: options.warning ? COLORS.red : "000000" })],
  });
}

async function writeBusinessDoc(item, source) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: COLORS.blue, space: 1 } },
      children: [new TextRun({ text: item.title, bold: true, size: 36, font: "Arial", color: COLORS.navy })],
    }),
    paragraph(item.summary),
    twoColumnTable([
      ["항목", "값"],
      ["콘텐츠 ID", item.id],
      ["소스", source],
      ["문서 유형", item.type],
      ["업무 기준일", `${item.date} KST`],
      ["작성자", `${item.owner[0]} / ${item.owner[1]}`],
      ["상태", item.status],
      ["권한 대상", item.acl],
      ["검색 키워드", item.keywords.join(", ")],
    ]),
  ];

  for (const [sectionTitle, entries] of item.sections) {
    children.push(heading(sectionTitle, HeadingLevel.HEADING_2));
    entries.forEach((entry) => children.push(paragraph(entry, { bullet: true })));
  }

  children.push(heading("근거 및 사용 주의", HeadingLevel.HEADING_2));
  children.push(
    paragraph("본 문서는 Track1 샘플 데이터와 연결되는 가상 워크숍 콘텐츠다. 실제 고객, 임직원 또는 운영 사실을 포함하지 않는다.", { warning: true }),
    paragraph("정형 수치는 FabricIQ 기준값과 원본 행을 다시 확인하고, 미해결 품질 이슈가 있으면 경고와 함께 인용한다.", { bullet: true }),
  );

  const createdAt = new Date(`${item.date}T09:00:00+09:00`);
  const doc = new Document({
    creator: item.owner[0],
    title: item.title,
    subject: item.type,
    description: item.summary,
    keywords: item.keywords.join(", "),
    lastModifiedBy: item.owner[0],
    revision: 1,
    createdAt,
    modifiedAt: createdAt,
    styles: {
      default: { document: { run: { font: "Arial", size: 21 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 32, bold: true, color: COLORS.navy },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Arial", size: 26, bold: true, color: COLORS.blue },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1100, right: 1440, bottom: 1100, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Track2 Sample | ${item.id} | Page `, size: 17, color: "666666" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 17, color: "666666" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const target = path.join(OUT, source.toLowerCase(), item.folder, item.file);
  fs.writeFileSync(target, await Packer.toBuffer(doc));
  return path.relative(OUT, target);
}

function encodedHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function emlDate(value) {
  return new Date(value).toUTCString();
}

function messageId(id) {
  return `<${id.toLowerCase()}.track2@contoso-workshop.example>`;
}

function writeEml(message) {
  const sender = people[message.sender];
  const to = message.to.map((key) => `${people[key][0]} <${key}@contoso-workshop.example>`).join(", ");
  const cc = message.cc.map((key) => `${people[key][0]} <${key}@contoso-workshop.example>`).join(", ");
  const headers = [
    `From: ${encodedHeader(sender[0])} <${message.sender}@contoso-workshop.example>`,
    `To: ${to}`,
    `Cc: ${cc}`,
    `Date: ${emlDate(message.date)}`,
    `Subject: ${encodedHeader(message.subject)}`,
    `Message-ID: ${messageId(message.id)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "X-Track2-Sample: true",
    `X-Track2-Thread: ${message.thread}`,
    `X-Track2-Keywords: ${message.keywords.join(";")}`,
  ];
  if (message.replyTo) {
    headers.push(`In-Reply-To: ${messageId(message.replyTo)}`, `References: ${messageId(message.replyTo)}`);
  }
  const signature = `${sender[0]}\n${sender[1]} | Contoso Commerce (가상)\n본 메일은 Track2 워크숍용 가상 콘텐츠입니다.`;
  const body = [...message.body, "", "감사합니다.", signature].join("\r\n\r\n");
  const content = `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
  const threadSlug = message.thread
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const file = `${message.id}_${threadSlug}_${message.replyTo ? "reply" : "message"}.eml`;
  fs.writeFileSync(path.join(OUT, "outlook", file), content, "utf8");
  return `outlook/${file}`;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => lines.push(headers.map((header) => csvEscape(row[header])).join(",")));
  fs.writeFileSync(file, `\uFEFF${lines.join("\n")}\n`, "utf8");
}

async function main() {
  cleanOutput();
  const manifest = [];

  for (const item of sharePointDocs) {
    const relativePath = await writeBusinessDoc(item, "sharepoint");
    manifest.push({
      id: item.id,
      source: "SharePoint",
      title: item.title,
      businessDate: item.date,
      owner: item.owner[0],
      location: relativePath,
      target: `/Track2-Sample/${item.folder}/${item.file}`,
      keywords: item.keywords,
      acl: item.acl,
      status: item.status,
      qualityFlags: item.status === "Draft" ? ["draft"] : item.status === "Restricted" ? ["restricted"] : [],
    });
  }

  for (const item of oneDriveDocs) {
    const relativePath = await writeBusinessDoc(item, "onedrive");
    manifest.push({
      id: item.id,
      source: "OneDrive",
      title: item.title,
      businessDate: item.date,
      owner: item.owner[0],
      location: relativePath,
      target: `/Track2-Sample/${item.folder}/${item.file}`,
      keywords: item.keywords,
      acl: item.acl,
      status: item.status,
      qualityFlags: item.status === "Draft" ? ["draft"] : item.status === "Restricted" ? ["restricted"] : [],
    });
  }

  const deploymentMessages = [];
  for (const message of outlookMessages) {
    const relativePath = writeEml(message);
    deploymentMessages.push(message);
    manifest.push({
      id: message.id,
      source: "Outlook",
      title: message.subject,
      businessDate: message.date,
      owner: people[message.sender][0],
      location: relativePath,
      target: "Configured sample recipients",
      keywords: message.keywords,
      acl: "Message recipients",
      status: message.replyTo ? "Reply" : "Original",
      qualityFlags: [],
    });
  }
  fs.writeFileSync(path.join(OUT, "outlook", "messages.json"), JSON.stringify(deploymentMessages, null, 2), "utf8");

  fs.writeFileSync(path.join(OUT, "teams", "threads.json"), JSON.stringify(teamsThreads, null, 2), "utf8");
  for (const thread of teamsThreads) {
    manifest.push({
      id: thread.id,
      source: "Teams",
      title: thread.title,
      businessDate: thread.messages[0][1],
      owner: people[thread.messages[0][0]][0],
      location: "teams/threads.json",
      target: thread.channel,
      keywords: thread.keywords,
      acl: `Team channel: ${thread.channel}`,
      status: `${thread.messages.length} messages`,
      qualityFlags: thread.qualityFlags || [],
    });
  }

  fs.writeFileSync(path.join(OUT, "manifests", "content_catalog.json"), JSON.stringify(manifest, null, 2), "utf8");
  writeCsv(
    path.join(OUT, "manifests", "content_manifest.csv"),
    ["id", "source", "title", "businessDate", "owner", "location", "target", "keywords", "acl", "status", "qualityFlags"],
    manifest,
  );

  const teamsMessageCount = teamsThreads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const summary = {
    packageVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    fictionalDataOnly: true,
    primaryContentCount: manifest.length,
    sourceCounts: {
      SharePoint: sharePointDocs.length,
      Outlook: outlookMessages.length,
      TeamsThreads: teamsThreads.length,
      TeamsMessages: teamsMessageCount,
      OneDrive: oneDriveDocs.length,
    },
    requiredKeywordCoverage: {
      SummerPush: ["SharePoint", "Outlook", "Teams"],
      VIPRetention: ["SharePoint", "Outlook", "OneDrive"],
      "AeroPhone X": ["SharePoint", "Outlook", "Teams"],
      "SmartWatch Pro": ["SharePoint", "Outlook", "Teams"],
      "UltraBook 15": ["SharePoint", "Outlook", "Teams"],
      "DailyTee Cotton": ["SharePoint", "Outlook", "Teams", "OneDrive"],
      "ComfyChair Home": ["SharePoint", "Outlook", "Teams", "OneDrive"],
      Platinum: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      Silver: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      BackToSchool: ["SharePoint", "Outlook", "Teams", "OneDrive"],
      FlashWeek: ["SharePoint", "Outlook", "Teams", "OneDrive"],
    },
    intentionalTrack2QualityCases: [
      "Draft documents",
      "Restricted ACL documents",
      "Aero Phone X alias in Teams",
      "Track1 data-quality warnings",
      "Campaign attribution coverage limitation",
      "Missing customer segment (C00007) kept separate",
      "P00050 zero-price outlier excluded from catalog",
    ],
  };
  fs.writeFileSync(path.join(OUT, "manifests", "readiness_expected.json"), JSON.stringify(summary, null, 2), "utf8");

  console.log(`Generated ${manifest.length} primary content items.`);
  console.log(`SharePoint DOCX: ${sharePointDocs.length}`);
  console.log(`Outlook EML: ${outlookMessages.length}`);
  console.log(`Teams threads/messages: ${teamsThreads.length}/${teamsMessageCount}`);
  console.log(`OneDrive DOCX: ${oneDriveDocs.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
