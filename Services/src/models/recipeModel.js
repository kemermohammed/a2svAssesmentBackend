import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recipeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  ingredients: [
    {
      name: { type: String, required: true },
      quantity: { type: String },
    },
  ],
  instructions: {
    type: String,
    required: true,
  },
  preparationTime: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
  }
});

const Recipe = model("Recipe", recipeSchema);

export default Recipe;
