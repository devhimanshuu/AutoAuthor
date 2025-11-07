const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

//@desc generate a book outline
// @route POST /api/ai/generate-outline
// @access Private
const generateOutline = async (req, res) => {
  try {
    const { topic, style, numChapters, description } = req.body;
    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const prompt = `You are an expert book author. Create a detailed book outline based on the following requirements:
    Topic: ${topic}
    Description: ${description || "N/A"}
    Writing Style: ${style || "N/A"}
    Number of Chapters: ${numChapters || 5}
    
    Requirements:
    1.Generate exactly ${numChapters || 5} chapters.
    2.Each chapter title should be clear , engaging and follow a logical progression.
    3. Each description should be 2-3 sentences explaining what the chapter will cover.
    4.Ensure chapters build upon each other coherently.
    5. Match the ${style} writing style in your title and description.
    
    Output format :
    return Only a valid JSON array with no additional text, markdown or formatting. each object must have exactly two keys "title" and "description".
    Example Structure:
    [
        {
            "title": "Chapter 1: Introduction to the Topic",
            "description": "A Comprehensive Overview introducing the main concepts. sets the foundation for understanding the subject matter."
        },
        {
            "title": "Chapter 2: Core Principles",
            "description": "A Explores the fundamental principles and theories. provides detailed explanations and real-world examples."
        }
        ]
        
        generate the outline now.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ type: "text", text: prompt }],
    });

    // robust extraction of returned text

    let text = "";
    if (response && typeof response.text === "string") {
      text = response.text;
    } else if (response && Array.isArray(response.outputs)) {
      text = response.outputs
        .map((out) => {
          if (Array.isArray(out.content)) {
            return out.content.map((c) => c.text || "").join(" ");
          }
          return out.text || "";
        })
        .join("\n");
    } else if (
      response &&
      Array.isArray(response.candidates) &&
      response.candidates[0]
    ) {
      text =
        response.candidates[0].content?.map((c) => c.text || "").join(" ") ||
        response.candidates[0].output ||
        "";
    } else {
      // fallback: stringify whole response for debugging
      text = JSON.stringify(response);
    }

    //find and extract the JSON array from the response text
    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");
    if (startIndex === -1 || endIndex === -1) {
      return res
        .status(500)
        .json({ message: "Failed to parse outline from AI response" });
    }
    const jsonString = text.substring(startIndex, endIndex + 1);

    //validate if the response is a valid JSON
    try {
      const outline = JSON.parse(jsonString);
      res.status(200).json({ outline });
    } catch (e) {
      console.error("failed to parse AI response", jsonString);
      res.status(500).json({
        message:
          "Failed to generate a valid outline. the AI response is not valid JSON",
      });
    }
  } catch (error) {
    console.error("Error generating outline:", error);

    res.status(500).json({ message: "Server Error during outline generation" });
  }
};

//@desc generate book content for a chapter
// @route POST /api/ai/generate-chapter
// @access Private
const generateChapterContent = async (req, res) => {
  try {
    const { chapterTitle, chapterDescription, style } = req.body;
    if (!chapterTitle) {
      return res
        .status(400)
        .json({ message: "Chapter title is required" });
    }

    const prompt=`You are expert writer specializing in ${style} content. Write a complete chapter for a book with the following specifications:
    Chapter Title: ${chapterTitle}
    Chapter Description: ${chapterDescription || "N/A"}
    Writing Style: ${style || "N/A"}
    Target length: Approximately 1500-2000 words.
    Requirements:
    1.Write in a ${style.toLowerCase()} tone througthout the chapter.
    2.structure the content with clear sections and smooth transitions.
    3.Include relevant examples, anecdotes, or data to support key points.
    4.Ensure the content flows logically from introduction to conclusion.
    5.make the content engaging and informative for readers.
    ${chapterDescription ? "6. Cover all points mentioned in the chapter description." : ""}
    
    format guidelines:
    -Start with a compelling opening paragraph to hook the reader.
    -use clear paragraphs break for readability.
    -include subheadings if appropriate for the next chapter structure.
    -write in plain text without any markdown formating
    
    generate the chapter content now.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ type: "text", text: prompt }],
    });

    res.status(200).json({ content: response.text });
  } catch (error) {
    console.error("Error generating chapter content:", error);

    res
      .status(500)
      .json({ message: "Server Error during chapter content generation" });
  }
};

module.exports = {
  generateOutline,
  generateChapterContent,
};
