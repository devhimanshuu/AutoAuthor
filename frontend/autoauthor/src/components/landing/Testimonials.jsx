import React from "react";
import { TESTIMONIALS } from "../../utils/data";
import { Star, Quote } from "lucide-react";
const Testimonials = () => {
  return (
    <div
      id="testimonials"
      className="relative py-24 lg:py-32 bg-gradient-to-br from-violet-50 via-purple-50 to-white overflow-hidden"
    >
      {/*Decorative Element*/}
      <div className="absolute top-20 right-10 w-64 bg-violet-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        {/*Header*/}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-violet-100 shadow-sm ">
            <Star className="w-4 h-4 text-violet-600 fill-violet-600" />
            <span className="text-sm font-semibold text-violet-900">
              Testimonials
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Loved by Creators{" "}
            <span className="block mt-2 bg-gradient-to-br from-violet-600 to-purple-600 text-transparent bg-clip-text">
              Everywhere
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it, Here's what some of our users have
            to say about AutoAuthor
          </p>
        </div>
        {/*Testimonials*/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonials, index) => (
            <div
              key={index}
              className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 hover:border-violet-200 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 rotate-6 group-hover:rotate-12 transition-transform duration-300">
                <Quote className=" w-6 h-6 text-white" />
              </div>

              <div className="flex items-center space-x-1 mb-6">
                {[...Array(testimonials.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-700 mb-8 leading-relaxed text-base">
                "{testimonials.quote}"
              </p>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src={testimonials.avatar}
                    alt={testimonials.author}
                    className="w-14 h-14 rounded-full object-cover relative border-2 ring-2 ring-white shadow-lg"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">
                    {testimonials.author}.
                  </p>
                  <p className="text-sm text-violet-600">
                    {testimonials.title}
                  </p>
                </div>
              </div>

              {/*Hover Gradient*/}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/*Bottom Stats*/}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">5K+</div>
            <div className="text-gray-600 mt-2">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600 mt-2">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">15K+</div>
            <div className="text-gray-600 mt-2">Ebooks Created</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
