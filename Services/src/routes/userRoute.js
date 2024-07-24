import {Recipe} from "../models/recipeModel"

import { User } from "../models/userModel"

const recipeCreate = async(req,res) =>{
try{
 
    const recipData = req.body
    const recipes = await Recipe.create(recipData)

    const users = User.findById

    res.status(200).json({"status":"successful",recipes:recipes})}
    catch{

        res.status(300).json({"status":"internal server error"})
    }
    
}