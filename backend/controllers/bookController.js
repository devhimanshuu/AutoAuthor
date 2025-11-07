const Book = require("../Models/Book");

//@desc create new book
// @route POST /api/books
// @access Private

const createBook = async (req, res) => {
  try {
    const { title, author, subtitle, chapters } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and Author are required" });
    }

    const newBook = await Book.create({
      userId: req.user.id,
      title,
      author,
      subtitle,
      chapters,
    });

    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc get all books for user
// @route GET /api/books
// @access Private
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc get book by id
// @route GET /api/books/:id
// @access Private
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc update book
// @route PUT /api/books/:id
// @access Private
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this book" });
    }
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc delete book
// @route DELETE /api/books/:id
// @access Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this book" });
    }
    await Book.deleteOne({ _id: req.params.id });

    res.status(204).json("Book deleted successfully");
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

//@desc update book cover image
// @route PUT /api/books/cover/:id
// @access Private
const updateBookCover = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this book cover" });
    }

    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file" });
    }

    // Update the cover image URL
    book.coverImage = req.file.filename; 

    const updatedBook = await book.save();
    
    res.status(200).json({
      message: "Cover image updated successfully",
      book: updatedBook
    });
  } catch (error) {
    console.error('Error updating cover:', error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  updateBookCover,
};
