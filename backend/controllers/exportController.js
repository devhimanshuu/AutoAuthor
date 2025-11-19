const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  ImageRun,
  Spacing,
} = require("docx");
const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const Book = require("../Models/Book");
const path = require("path");
const fs = require("fs");
const { title } = require("process");

const md = new MarkdownIt();

//Typography configurations matching the pdf export
const DOCX_STYLES = {
  fonts: {
    body: "Charter",
    heading: "Inter",
  },
  sizes: {
    title: 32,
    subtitle: 20,
    author: 18,
    chapterTitle: 24,
    h1: 20,
    h2: 18,
    h3: 16,
    body: 12,
  },
  spacing: {
    paragraphBefore: 200,
    paragraphAfter: 200,
    chapterBefore: 400,
    chapterAfter: 300,
    headingBefore: 300,
    headingAfter: 150,
  },
};

//Process markdown tokens into docx paragraphs
function processMarkdownToDocx(markdown) {
  const tokens = md.parse(markdown, {});
  const paragraphs = [];
  let inList = false;
  let listType = null;
  let orderCounter = 1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    try {
      if (token.type === "paragraph_open") {
        const level = parseInt(token.tag.substring(1));
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          let headingLevel;
          let fontSize;

          switch (level) {
            case 1:
              headingLevel = HeadingLevel.HEADING_1;
              fontSize = DOCX_STYLES.sizes.h1;
              break;
            case 2:
              headingLevel = HeadingLevel.HEADING_2;
              fontSize = DOCX_STYLES.sizes.h2;
              break;
            case 3:
              headingLevel = HeadingLevel.HEADING_3;
              fontSize = DOCX_STYLES.sizes.h3;
              break;
            default:
              headingLevel = HeadingLevel.HEADING_3;
              fontSize = DOCX_STYLES.sizes.h3;
          }

          paragraphs.push(
            new Paragraph({
              text: nextToken.content,
              heading: headingLevel,
              spacing: {
                before: DOCX_STYLES.spacing.headingBefore,
                after: DOCX_STYLES.spacing.headingAfter,
              },
              style: {
                font: DOCX_STYLES.fonts.body,
                size: fontSize,
              },
            })
          );
        }
        i += 2; //skip inline and paragraph_close
      } else if (token.type === "paragraph_open") {
        const nextToken = tokens[i + 1];

        if (nextToken && nextToken.type === "inline" && nextToken.children) {
          const textRuns = processInlineTokens(nextToken.children);

          if (textRuns.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: textRuns,
                spacing: {
                  before: inList ? 100 : DOCX_STYLES.spacing.paragraphBefore,
                  after: inList ? 100 : DOCX_STYLES.spacing.paragraphAfter,
                  line: 360,
                },
                alignment,
              })
            );
          }
          i += 2; //skip inline and paragraph_close
        } else if (token.type === "bullet_list_open") {
          inList = true;
          listType = "bullet";
        } else if (token.type === "ordered_list_open") {
          inList = false;
          listType = null;
          // add spacing after list
          paragraphs.push(
            new Paragraph({
              text: "",
              spacing: { after: 100 },
            })
          );
        } else if (token.type === "ordered_list_open") {
          inList = true;
          listType = "ordered";
          orderCounter = 1;
        } else if (token.type === "ordered_list_close") {
          inList = false;
          listType = null;
          // add spacing after list
          paragraphs.push(
            new Paragraph({
              text: "",
              spacing: { after: 100 },
            })
          );
        } else if (token.type === "list_item_open") {
          const nextToken = tokens[i + 1];

          if (nextToken && nextToken.type === "paragraph_open") {
            const inlineToken = tokens[i + 2];
            if (
              inlineToken &&
              inlineToken.type === "inline" &&
              inlineToken.children
            ) {
              const textRuns = processInlineTokens(inlineToken.children);

              let bulletText = " ";
              if (listType === "bullet") {
                bulletText = "• ";
              } else if (listType === "ordered") {
                bulletText = `${orderCounter}. `;
                orderCounter++;
              }

              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: bulletText,
                      font: DOCX_STYLES.fonts.body,
                      size: DOCX_STYLES.sizes.body,
                    }),
                    ...textRuns,
                  ],
                  spacing: { bedore: 50, after: 50 },
                  indent: { left: 720 },
                })
              );
              i += 4; //skip paragraph_open, inline, paragraph_close, list_item_close
            }
          }
        } else if (token_type === "block_quote_open") {
          //find block quote content
          const nextToken = tokens[i + 1];
          if (nextToken && nextToken.type === "paragraph_open") {
            const inlineToken = tokens[i + 2];
            if (
              inlineToken &&
              inlineToken.type === "inline" &&
              inlineToken.children
            ) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: inlineToken.content,
                      italics: true,
                      color: "666666",
                      font: DOCX_STYLES.fonts.body,
                    }),
                  ],
                  spacing: { before: 200, after: 200 },
                  indent: { left: 720 },
                  alignment: AlignmentType.JUSTIFIED,
                  border: {
                    left: {
                      color: "4F46E5",
                      space: 1,
                      style: "single",
                      size: 24,
                    },
                  },
                })
              );
              i += 4; //skip paragraph_open, inline, paragraph_close, block_quote_close
            }
          }
        } else if (token.type === "code_block" || token.type === "fence") {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: token.content,
                  font: "Courier New",
                  size: 20,
                  color: "333333",
                }),
              ],
              spacing: { before: 200, after: 200 },
              shading: {
                fill: "F5F5F5",
              },
            })
          );
        } else if (token.type === "hr") {
          paragraphs.push(
            new Paragraph({
              text: "",
              border: {
                top: {
                  style: "single",
                  size: 6,
                  space: 1,
                  color: "CCCCCC",
                },
              },
              spacing: { before: 200, after: 200 },
            })
          );
        }
      }
    } catch (err) {
      console.error("Error processing markdown:", token.type, err);
      continue;
    }
  }

  return paragraphs;
}

//Process inline content (bold, italics, text)
const processInlineContents = (children) => {
  const textRuns = [];
  let currentFormatting = { bold: false, italics: false };
  let textBuffer = "";

  const flushText = () => {
    if (textBuffer.trim()) {
      textRuns.push(
        new TextRun({
          text: textBuffer,
          bold: currentFormatting.bold,
          italics: currentFormatting.italics,
          font: DOCX_STYLES.fonts.body,
          size: DOCX_STYLES.sizes.body,
        })
      );
      textBuffer = "";
    }
  };

  children.forEach((child) => {
    if (child.type === "strong_open") {
      flushText();
      currentFormatting.bold = true;
    } else if (child.type === "strong_close") {
      flushText();
      currentFormatting.bold = false;
    } else if (child.type === "em_open") {
      flushText();
      currentFormatting.italics = true;
    } else if (child.type === "em_close") {
      flushText();
      currentFormatting.italics = false;
    } else if (child.type === "text") {
      textBuffer += child.content;
    }
  });

  flushText();
  return textRuns;
};

const exportAsDocument = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to export this book" });
    }

    const sections = [];

    //cover page with image if available
    const coverPage = [];

    if (book.coverImage && !book.coverImage.includes("pravatar")) {
      const imagePath = book.coverImage.substring[1];

      try {
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);

          //add some top spacing
          coverPage.push(
            new Paragraph({
              text: "",
              spacing: { before: 1000 },
            })
          );

          coverPage.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 400,
                    height: 550,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              sapacing: { before: 200, after: 400 },
            })
          );

          //page break after cover
          coverPage.push(
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            })
          );
        }
      } catch (imgErr) {
        console.error("Error reading cover image:", imgErr);
      }
    }
    sections.push(...coverPage);

    // title page section
    titlePage = [];

    //main title
    titlePage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: book.title,
            bold: true,
            size: DOCX_STYLES.sizes.title * 2, // docx uses half-point sizes
            font: DOCX_STYLES.fonts.heading,
            color: "1A202C",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      })
    );

    //subtitle if available
    if (book.subtitle && book.subtitle.trim()) {
      titlePage.push(
        new Paragraph({
          children: [
            new TextRun({
              text: book.subtitle,
              bold: true,
              size: DOCX_STYLES.sizes.subtitle * 2,
              font: DOCX_STYLES.fonts.heading,
              color: "4A5568",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );
    }
    //Author name
    titlePage.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `by ${book.author || "Unknown Author"}`,
            font: DOCX_STYLES.fonts.heading,
            size: DOCX_STYLES.sizes.author * 2,
            color: "2D3748",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      })
    );

    //Decorative line
    titlePage.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "4F46E5",
            space: 1,
            style: "single",
            size: 6,
          },
        },
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    );

    sections.push(...titlePage);

    // process chapters

    book.chapters.forEach((chapter, index) => {
      try {
        if (index > 0) {
          //page break before new chapter except for the first one
          sections.push(
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            })
          );
        }
        //chapter title
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: chapter.title || `Chapter ${index + 1}`,
                bold: true,
                size: DOCX_STYLES.sizes.chapterTitle * 2,
                font: DOCX_STYLES.fonts.heading,
                color: "1A202C",
              }),
            ],
            spacing: {
              before: DOCX_STYLES.spacing.chapterBefore,
              after: DOCX_STYLES.spacing.chapterAfter,
            },
          })
        );

        //Chapter Content
        const contentParagraphs = md.parse(chapter.content || "", {});

        sections.push(...contentParagraphs);
      } catch (chapErr) {
        console.error(`Error processing chapter ${index + 1}:`, chapErr);
      }
    });

    //Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: sections,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    //send the document as a downloadable file

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${book.title.replace(/\s+/g, "_") || "book"}.docx`
    );
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("Error exporting document:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "An error occurred while exporting the document" });
    }
  }
};

//Typography configurations for modern ebook styling
const renderMarkdown = (doc, markdown) => {
  if (!markdown || markdown.trim() === "") return;
  const tokens = md.parse(markdown, {});
  let inList = false;
  let listType = null;
  let orderedListCounter = 1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    try {
      if (token.type === "heading_open") {
        const level = parseInt(token.tag.substring(1), 10);
        let fontSize;
        switch (level) {
          case 1:
            fontSize = TYPOGRAPHY.sizes.h1;
            break;
          case 2:
            fontSize = TYPOGRAPHY.sizes.h2;
            break;
          case 3:
            fontSize = TYPOGRAPHY.sizes.h3;
            break;
          default:
            fontSize = TYPOGRAPHY.sizes.h3;
        }
        doc.moveDown(TYPOGRAPHY.spacing.headingSpacing.before / TYPOGRAPHY.sizes.body);
        doc.font(TYPOGRAPHY.fonts.sansBold).fontSize(fontSize).fillColor(TYPOGRAPHY.colors.heading);
        if (i + 1 < tokens.length && tokens[i + 1].type === "inline") {
          renderInlineTokens(doc, tokens[i + 1].children, {
            align: "left",
            lineGap: 0,
          });
          i++;
        }
        doc.moveDown(TYPOGRAPHY.spacing.headingSpacing.after / TYPOGRAPHY.sizes.body);
        if (i + 1 < tokens.length && tokens[i + 1].type === "heading_close") {
          i++;
        }
      } else if (token.type === "paragraph_open") {
        doc.font(TYPOGRAPHY.fonts.serif).fontSize(TYPOGRAPHY.sizes.body).fillColor(TYPOGRAPHY.colors.text);
        if (i + 1 < tokens.length && tokens[i + 1].type === "inline") {
          renderInlineTokens(doc, tokens[i + 1].children, {
            align: "justify",
            lineGap: 2,
          });
          i++;
        }
        if (!inList) {
          doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
        }
      } else if (token.type === "bullet_list_open") {
        inList = true;
        listType = "bullet";
        doc.moveDown(TYPOGRAPHY.spacing.listSpacing / TYPOGRAPHY.sizes.body);
      } else if (token.type === "bullet_list_close") {
        inList = false;
        listType = null;
        doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
      } else if (token.type === "ordered_list_open") {
        inList = true;
        listType = "ordered";
        orderedListCounter = 1;
        doc.moveDown(TYPOGRAPHY.spacing.listSpacing / TYPOGRAPHY.sizes.body);
      } else if (token.type === "ordered_list_close") {
        inList = false;
        listType = null;
        orderedListCounter = 1;
        doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
      } else if (token.type === "list_item_open") {
        let bullet = "";
        if (listType === "bullet") {
          bullet = "* ";
        } else if (listType === "ordered") {
          bullet = `${orderedListCounter}`;
          orderedListCounter++;
        }
        doc.font(TYPOGRAPHY.fonts.serif).fontSize(TYPOGRAPHY.sizes.body).fillColor(TYPOGRAPHY.colors.text);
        doc.text(bullet, { indent: 20, continued: true });
      } else if (token.type === "code_block" || token.type === "fence") {
        doc.moveDown(TYPOGRAPHY.spacing.paragraphSpacing / TYPOGRAPHY.sizes.body);
      } else if (token.type === "hr") {
        doc.moveDown();
        const y = doc.y;
        doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
        doc.moveDown();
      }
      // Add more token types as needed
    } catch (tokenError) {
      console.error("Error processing tokens", token.type, tokenError);
      continue;
    }
  }
};









const TYPOGRAPHY = {
  fonts: {
    serif: "Times-Roman",
    serifBold: "Times-Bold",
    serifItalic: "Times-Italic",
    sans: "Helvetica",
    sansBold: "Helvetica-Bold",
    sansItalic: "Helvetica-Oblique",
  },
  sizes: {
    title: 28,
    author: 16,
    chapterTitle: 20,
    h1: 18,
    h2: 16,
    h3: 14,
    body: 11,
    caption: 9,
  },
  spacing: {
    paragraphSpacing: 12,
    chapterSpacing: 24,
    headingSpacing: { before: 16, after: 8 },
    listSpacing: 6,
  },
  colors: {
    text: "#333333",
    heading: "1A1A1A",
    accent: "#4F46E5",
  },
};

const renderInlineTokens = (doc, tokens, options = {}) => {
  if (!tokens || tokens.length === 0) return;

  const baseOptions = {
    align: "justify" || options.align,
    indent: options.indent || 0,
    lineGap: options.lineGap || 2,
  };

  let currentFont = TYPOGRAPHY.fonts.serif;
  let textBuffer = "";

  const flushBuffer = () => {
    if (textBuffer) {
      doc
        .font(currentFont)
        .text(textBuffer, { ...baseOptions, continued: true });
      textBuffer = "";
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "text") {
      textBuffer += token.content;
    } else if (token.type === "strong_open") {
      flushBuffer();
      currentFont = TYPOGRAPHY.fonts.serifBold;
    } else if (token.type === "strong_close") {
      flushBuffer();
      currentFont = TYPOGRAPHY.fonts.serif;
    } else if (token.type === "em_open") {
      flushBuffer();
      currentFont = TYPOGRAPHY.fonts.serifItalic;
    } else if (token.type === "em_close") {
      flushBuffer();
      currentFont = TYPOGRAPHY.fonts.serif;
    } else if (token.type === "code_inline") {
      flushBuffer();
      doc
        .font("Courier")
        .text(token.content, { ...baseOptions, continued: true });
      doc.font(currentFont);
    }
  }

  if(textBuffer){
    doc.font(currentFont).text(textBuffer,{...baseOptions,continued:false});

  }else {
    doc.text("",{continued:false});
  }
};



const exportAsPDF = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have permission to export this book" });
    }
    // Create PDF
    const doc = new PDFDocument({
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      bufferPages: true,
      autoFirstPage: false,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${book.title.replace(/\s+/g, "_") || "book"}.pdf"`
    );
    doc.pipe(res);

    // Always add at least one page
    doc.addPage();

    // Cover image (if exists and not a placeholder)
    if (book.coverImage && !book.coverImage.includes("pravatar")) {
      try {
        const imagePath = book.coverImage.startsWith("/") ? path.join(__dirname, "..", book.coverImage) : book.coverImage;
        if (fs.existsSync(imagePath)) {
          const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
          doc.image(imagePath, doc.page.margins.left, doc.page.margins.top, {
            fit: [pageWidth * 0.8, pageHeight * 0.8],
            align: "center",
            valign: "center",
          });
          doc.addPage();
        }
      } catch (imgErr) {
        console.warn("Could not add cover image:", imgErr.message);
      }
    }

    // Title page
    doc.fontSize(24).text(book.title, { align: "center" });
    doc.moveDown(2);
    if (book.subtitle && book.subtitle.trim()) {
      doc.fontSize(16).text(book.subtitle, { align: "center" });
      doc.moveDown(1);
    }
    doc.fontSize(12).text(`by ${book.author || "Unknown Author"}`, { align: "center" });
    doc.addPage();

    // Chapters
    if (book.chapters && book.chapters.length > 0) {
      book.chapters.forEach((chapter, index) => {
        doc.addPage();
        doc.fontSize(18).text(chapter.title || `Chapter ${index + 1}`, { align: "center" });
        doc.moveDown();
        if (chapter.content && chapter.content.trim()) {
          // Simple markdown strip for now
          const contentText = chapter.content
            .replace(/#{1,6}\s+/g, "")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/\[(.*?)\]\(.*?\)/g, "$1")
            .replace(/\n\n/g, "\n");
          doc.fontSize(12).text(contentText, { align: "justify" });
        }
      });
    }

    // Add page numbers after all content, before doc.end()
    if (doc.bufferedPageRange && doc.bufferedPageRange().count > 0) {
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(
          `Page ${i + 1} of ${range.count}`,
          0,
          doc.page.height - 50,
          { align: "center" }
        );
      }
    }
    doc.end();
  } catch (err) {
    console.error("Error exporting PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred while exporting the PDF" });
    }
  }


      // Ensure at least one page exists before writing
      if (doc.page === null) {
        doc.addPage();
      }

      // ... (write all your content here, e.g., title, chapters, etc.) ...

      // Add page numbers only if there are pages
      if (doc.bufferedPageRange && doc.bufferedPageRange().count > 0) {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(10).text(
            `Page ${i + 1} of ${range.count}`,
            0,
            doc.page.height - 50,
            { align: "center" }
          );
        }
      }
      // Finalize PDF
      doc.end();
};

module.exports = {
  exportAsDocument,
  exportAsPDF,
};
