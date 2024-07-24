import express from "express";
import {
  recipeCreate,
  recipeUpdate,
  getAllRecipes,
  getRecipeById,
  deleteRecipe,
} from "../controllers/recipeController";


const router = express.Router();

router.post("/recipes",  recipeCreate);
router.put("/recipes/:id",  recipeUpdate);
router.get("/recipes", getAllRecipes);
router.get("/recipes/:id", getRecipeById);
router.delete("/recipes/:id", deleteRecipe);

export default router;
