const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://gamingfury317:pujan123@cluster0.wtdyl6u.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const listSchema = new mongoose.Schema({ name: String, items: [itemsSchema] });

const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-~ Hit this to delete an item." });
const defaultItems = [item1, item2, item3];

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.get("/", async function (req, res) {
  const day = date.getDate();

  const foundItems = await Item.find();

  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
  }

  res.render("list", {
    listTitle: "Today",
    newListItems: foundItems,
  });
});

app.post("/", async function (req, res) {
  const listName = req.body.list;
  const item = req.body.newItem;

  if (listName == "Today") {
    const itemName = new Item({ name: item });
    itemName.save();
    res.redirect("/");
  } else {
    const existingList = await List.findOne({ name: listName }).exec();
    existingList.items.push({ name: item });
    existingList.save();
    res.redirect(`/${_.lowerCase(listName)}`);
  }
});

app.post("/delete", async function (req, res) {
  const rawString = req.body.checkbox.toString();
  const array = rawString.split(",");
  const listName = array[1];
  const checkItemId = array[0];

  if (listName == "Today") {
    await Item.deleteOne({ _id: checkItemId });
    res.redirect("/");
  } else {
    await List.updateOne(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    );
    res.redirect(`/${listName}`);
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  let foundList = await List.findOne({ name: customListName }).exec();

  if (foundList === null) {
    const list = new List({ name: customListName, items: defaultItems });
    await list.save();
    res.redirect(`/${_.lowerCase(customListName)}`);
    return;
  }
  res.render("list", {
    listTitle: foundList.name,
    newListItems: foundList.items,
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
