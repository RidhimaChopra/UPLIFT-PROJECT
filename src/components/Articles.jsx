


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as jwtDecode from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Edit, Trash2, Star, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const Button = ({ children, primary, className, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
      primary
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-600'
    } ${className}`}
  >
    {children}
  </button>
);

const Modal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

function Articles() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyArticles, setShowMyArticles] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(6);
  const [viewingArticle, setViewingArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode.jwtDecode(token);
      setCurrentUser(decoded);
    }
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get('http://localhost:3000/articles');
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      if (editingArticle) {
        await axios.put(`http://localhost:3000/articles/${editingArticle.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setEditingArticle(null);
      } else {
        await axios.post('http://localhost:3000/articles', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setTitle('');
      setContent('');
      setImage(null);
      setIsModalOpen(false);
      fetchArticles();
    } catch (error) {
      console.error('Error posting/editing article:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setIsModalOpen(true);
  };

  const handleReview = async (articleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/articles/${articleId}/reviews`, 
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(5);
      setComment('');
      fetchArticles();
      
      if (viewingArticle && viewingArticle.id === articleId) {
        const updatedArticle = articles.find(a => a.id === articleId);
        setViewingArticle(updatedArticle);
      }
    } catch (error) {
      console.error('Error posting review:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.author.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = showMyArticles ? article.author.id === currentUser?.id : true;
    return matchesSearch && matchesUser;
  });

  
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white text-gray-800">
      <div className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-4xl font-bold mb-8 text-center text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Explore Our Articles
        </motion.h2>
        
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showMyArticles}
                onChange={(e) => setShowMyArticles(e.target.checked)}
                className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out"
              />
              <span>My Articles</span>
            </label>
            <Button primary onClick={() => setIsModalOpen(true)}>
              Create Article
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentArticles.map((article) => (
            <motion.div
              key={article.id}
              className="bg-white rounded-lg shadow-xl overflow-hidden"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {article.image && (
                <img src={`http://localhost:3000${article.image}`} alt={article.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
                <p className="text-gray-600 mb-4">{article.content.substring(0, 100)}...</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">By: {article.author.username}</p>
                  <div className="flex items-center">
                    <Star className="text-yellow-400 mr-1" size={16} />
                    <span className="text-sm font-semibold">{article.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button className="flex justify-between items-center" onClick={() => setViewingArticle(article)}>
                    <Eye size={16} className="mr-2" />
                    View Details
                  </Button>
                  {currentUser && article.author.id === currentUser.id && (
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(article)} className="text-blue-500 hover:text-blue-600">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => handleDelete(article.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        
        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {Array.from({ length: Math.ceil(filteredArticles.length / articlesPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === index + 1 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredArticles.length / articlesPerPage)}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4">{editingArticle ? 'Edit Article' : 'Create Article'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
            rows="4"
          ></textarea>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button primary type="submit">{editingArticle ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingArticle} onClose={() => setViewingArticle(null)}>
        {viewingArticle && (
          <div>
            <h3 className="text-2xl font-bold mb-4">{viewingArticle.title}</h3>
            {viewingArticle.image && (
              <img src={`http://localhost:3000${viewingArticle.image}`} alt={viewingArticle.title} className="w-full h-48 object-cover mb-4 rounded" />
            )}
            <p className="text-gray-600 mb-4">{viewingArticle.content}</p>
            <p className="text-sm text-gray-500 mb-4">By: {viewingArticle.author.username}</p>
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Reviews</h4>
              {viewingArticle.reviews.map((review) => (
                <div key={review.id} className="bg-gray-100 p-3 rounded mb-2">
                  <div className="flex items-center mb-1">
                    <Star className="text-yellow-400 mr-1" size={16} />
                    <span className="font-semibold">{review.rating}/5</span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                  <p className="text-xs text-gray-500">By: {review.user.username}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Add a Review</h4>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    size={24}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Your review"
                className="w-full p-2 border border-gray-300 rounded mb-2"
                rows="3"
              ></textarea>
              <Button primary onClick={() => handleReview(viewingArticle.id)}>
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Articles;

