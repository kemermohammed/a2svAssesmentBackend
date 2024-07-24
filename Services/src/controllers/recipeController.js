import Recipe from "../models/recipeModel.js";
import User from "../models/userModel.js";



const recipeCreate = async (req, res) => {
  const { title, ingredients, instructions, preparationTime } = req.body;
  try {
   
    const createdBy = req.user._id;

    const recipe = await Recipe.create({
      title,
      ingredients,
      instructions,
      preparationTime,
      createdBy,
    });

   
    await User.findByIdAndUpdate(createdBy, { $push: { recipes: recipe._id } });

    res.status(201).json({ status: "success", recipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "internal server error" });
  }
};


const recipeUpdate = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedRecipe) {
      return res.status(404).json({ status: "recipe not found" });
    }

    res.status(200).json({ status: "success", recipe: updatedRecipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "internal server error" });
  }
};

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json({ status: "success", recipes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "internal server error" });
  }
};


const getRecipeById = async (req, res) => {
  const { id } = req.params;
  try {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ status: "recipe not found" });
    }
    res.status(200).json({ status: "success", recipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "internal server error" });
  }
};


const deleteRecipe = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(id);
    if (!deletedRecipe) {
      return res.status(404).json({ status: "recipe not found" });
    }
    res.status(200).json({ status: "success", recipe: deletedRecipe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "internal server error" });
  }
};

export {
  recipeCreate,
  recipeUpdate,
  getAllRecipes,
  getRecipeById,
  deleteRecipe,
};
