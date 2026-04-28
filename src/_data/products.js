// src/_data/products.js
const fs = require("fs");
const path = require("path");

const productsDir = path.join(__dirname, "products");

function getAllProducts() {
  if (!fs.existsSync(productsDir)) return [];
  
  const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md"));
  const products = [];
  
  for (const file of files) {
    const filePath = path.join(productsDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    
    // Extract front matter (between --- and ---)
    const match = content.match(/^---\n([\s\S]+?)\n---\n/);
    if (!match) continue;
    
    const frontMatter = match[1];
    const lines = frontMatter.split("\n");
    const data = {};
    let currentKey = null;
    let currentList = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.trim() === "") continue;
      
      // Check for list item (starts with "- ")
      if (line.trim().startsWith("- ")) {
        const item = line.trim().substring(2).trim();
        if (currentKey && inList) {
          currentList.push(item);
        }
        continue;
      }
      
      // If we were collecting a list, save it now
      if (inList && currentKey) {
        data[currentKey] = currentList;
        currentList = [];
        inList = false;
        currentKey = null;
      }
      
      // Regular key: value line
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Check if this key starts a list (value empty, next line has "- ")
        if (value === "" && i + 1 < lines.length && lines[i+1].trim().startsWith("- ")) {
          currentKey = key;
          inList = true;
          currentList = [];
        } else {
          data[key] = value;
        }
      }
    }
    // Save any remaining list
    if (inList && currentKey) {
      data[currentKey] = currentList;
    }
    
    const id = path.basename(file, ".md");
    
    products.push({
      id: id,
      sku: "",
      name: data.name,
      price: parseInt(data.price, 10),
      image: data.image,
      category: data.category,
      subcategory: data.subcategory || "",
      colors: data.colors || [],
      description: data.description || "",
      size: data.size || "6 yards"
    });
  }
  
  // Generate SKUs
  products.sort((a, b) => a.id.localeCompare(b.id));
  products.forEach((p, idx) => {
    const catPrefix = p.category.substring(0, 3).toUpperCase();
    p.sku = `${catPrefix}-${String(idx + 1).padStart(4, "0")}`;
  });
  
  return products;
}

module.exports = getAllProducts();
