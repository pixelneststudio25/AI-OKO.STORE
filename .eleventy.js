module.exports = function(eleventyConfig) {
  // Copy the "src" folder to the output folder ("_site")
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("admin");   // also copy the admin folder

  return {
    dir: {
      input: "src",      // where your HTML/CSS/JS live
      output: "_site"    // built site (Netlify will serve this)
    }
  };
};