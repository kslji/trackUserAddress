const categoryEnum = require("../enum/category.type.enum");

function getCategoryTypes(categotyType) {
  let category = [];
  if (categotyType === categoryEnum.ALL) {
    category = [
      categoryEnum.ERC20,
      categoryEnum.ERC721,
      categoryEnum.EXTERNAL,
      categoryEnum.INTERNAL,
    ];
  } else {
    category.push(categotyType);
  }
  return category;
}


module.exports = {
  getCategoryTypes: getCategoryTypes,
};
