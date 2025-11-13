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
      return res
        .status(403)
        .json({ message: "You do not have permission to export this book" });
    }

    //create pdf with safe settings
    const doc = new PDFDocument({
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      bufferPages: true,
      autoFirstPage: false,
    });
    //set headers before piping
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${book.title.replace(/\s+/g, "_") || "book"}.pdf"`
    );
    doc.pipe(res);

    if (book.coverImage && !book.coverImage.includes("pravatar")) {
      const imagePath = book.coverImage.substring[1];

      try {
        if (fs.existsSync(imagePath)) {
          const pageWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
          const pageHeight =
            doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
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
      //Title page
      doc
        .font(TYPOGRAPHY.fonts.sansBold)
        .fontSize(TYPOGRAPHY.sizes.title)
        .fillColor(TYPOGRAPHY.colors.heading)
        .text(book.title, {
          align: "center",
        });
      doc.moveDown(2);

      if (book.subtitle && book.subtitle.trim()) {
        doc
          .font(TYPOGRAPHY.fonts.sans)
          .fontSize(TYPOGRAPHY.sizes.h2)
          .fillColor(TYPOGRAPHY.colors.text)
          .text(book.subtitle, {
            align: "center",
          });
        doc.moveDown(1);
      }
      doc
        .font(TYPOGRAPHY.fonts.sans)
        .fontSize(TYPOGRAPHY.sizes.author)
        .fillColor(TYPOGRAPHY.colors.text)
        .text(`by ${book.author || "Unknown Author"}`, {
          align: "center",
        });

      //process chapters
      if (book.chapters && book.chapters.length > 0) {
        book.chapters.forEach((chapter, index) => {
          try {
            doc.addPage();

            doc
              .font(TYPOGRAPHY.fonts.sansBold)
              .fontSize(TYPOGRAPHY.sizes.chapterTitle)
              .fillColor(TYPOGRAPHY.colors.heading)
              .text(chapter.title || "Chapter ${index + 1}", {
                align: "center",
              });
            doc.moveDown(
              TYPOGRAPHY.spacing.chapterSpacing / TYPOGRAPHY.size.body
            );

            //chapter content
            if (chapter.content && chapter.content.trim()) {
              renderMarkdown(chapter.content, doc);
            }
          } catch (chapErr) {
            console.error(`Error processing chapter ${index + 1}:`, chapErr);
          }
        });

        //Finalize PDF

        doc.end();
      }
    }
  } catch (err) {
    console.error("Error exporting PDF:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "An error occurred while exporting the PDF" });
    }
  }

  // try {
  //   const { bookId } = req.params;

  //   // Fetch the book from database
  //   const book = await Book.findById(bookId);
  //   if (!book) {
  //     return res.status(404).json({ message: "Book not found" });
  //   }

  //   // Verify user authorization
  //   if (book.userId.toString() !== req.user.id.toString()) {
  //     return res.status(401).json({ message: "Not authorized to export this book" });
  //   }

  //   // Create PDF document
  //   const pdfDoc = new PDFDocument({
  //     margin: 50,
  //     bufferPages: true,
  //     font: "Helvetica",
  //   });

  //   // Set response headers for PDF download
  //   res.setHeader("Content-Type", "application/pdf");
  //   res.setHeader(
  //     "Content-Disposition",
  //     `attachment; filename="${book.title.replace(/\s+/g, "_") || "book"}.pdf"`
  //   );

  //   // Pipe PDF to response
  //   pdfDoc.pipe(res);

  //   // Add title page
  //   pdfDoc.fontSize(32).font("Helvetica-Bold").text(book.title, { align: "center" });
  //   pdfDoc.moveDown(0.5);

  //   if (book.subtitle) {
  //     pdfDoc.fontSize(18).font("Helvetica").text(book.subtitle, { align: "center" });
  //     pdfDoc.moveDown(1);
  //   }

  //   pdfDoc.fontSize(14).font("Helvetica").text(`by ${book.author}`, { align: "center" });
  //   pdfDoc.moveDown(2);

  //   // Add cover image if exists
  //   if (book.coverImage && book.coverImage.trim() !== "") {
  //     try {
  //       const imagePath = path.join(__dirname, "..", book.coverImage);
  //       if (fs.existsSync(imagePath)) {
  //         pdfDoc.image(imagePath, {
  //           width: 200,
  //           align: "center",
  //         });
  //         pdfDoc.moveDown(1);
  //       }
  //     } catch (imgErr) {
  //       console.warn("Could not add cover image:", imgErr.message);
  //     }
  //   }

  //   // Add page break after title
  //   pdfDoc.addPage();

  //   // Add table of contents (chapters)
  //   if (book.chapter && book.chapter.length > 0) {
  //     pdfDoc.fontSize(20).font("Helvetica-Bold").text("Table of Contents", { underline: true });
  //     pdfDoc.moveDown(0.5);

  //     book.chapter.forEach((chapter, index) => {
  //       pdfDoc
  //         .fontSize(12)
  //         .font("Helvetica")
  //         .text(`${index + 1}. ${chapter.title}`, {
  //           indent: 20,
  //         });
  //     });

  //     pdfDoc.addPage();
  //   }

  //   // Add chapters
  //   if (book.chapter && book.chapter.length > 0) {
  //     book.chapter.forEach((chapter, index) => {
  //       // Chapter title
  //       pdfDoc.fontSize(18).font("Helvetica-Bold").text(`Chapter ${index + 1}: ${chapter.title}`, {
  //         underline: true,
  //       });
  //       pdfDoc.moveDown(0.5);

  //       // Chapter description
  //       if (chapter.description) {
  //         pdfDoc.fontSize(11).font("Helvetica-Oblique").text(chapter.description, {
  //           color: "#666666",
  //         });
  //         pdfDoc.moveDown(0.5);
  //       }

  //       // Chapter content (parse markdown if needed)
  //       if (chapter.content) {
  //         // Simple markdown to text conversion
  //         let contentText = chapter.content
  //           .replace(/#{1,6}\s+/g, "") // Remove markdown headings
  //           .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
  //           .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
  //           .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Convert links to plain text
  //           .replace(/\n\n/g, "\n"); // Normalize line breaks

  //         pdfDoc.fontSize(11).font("Helvetica").text(contentText, {
  //           align: "justify",
  //         });
  //       }

  //       pdfDoc.moveDown(1);

  //       // Add page break between chapters (except for the last one)
  //       if (index < book.chapter.length - 1) {
  //         pdfDoc.addPage();
  //       }
  //     });
  //   }

  //   // Add footer with page numbers
  //   const pageCount = pdfDoc.bufferedPageRange().count;
  //   for (let i = 1; i <= pageCount; i++) {
  //     pdfDoc.switchToPage(i - 1);
  //     pdfDoc.fontSize(10).text(`Page ${i} of ${pageCount}`, 50, pdfDoc.page.height - 50, {
  //       align: "center",
  //     });
  //   }

  //   // Finalize PDF
  //   pdfDoc.end();
  // } catch (error) {
  //   console.error("Error exporting PDF:", error);
  //   if (!res.headersSent) {
  //     res.status(500).json({ message: "An error occurred while exporting the PDF" });
  //   }
  // }
};

module.exports = {
  exportAsDocument,
  exportAsPDF,
};
