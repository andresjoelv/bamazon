var mysql = require('mysql');
var inquirer = require('inquirer');
var Table = require('cli-table');

// helpful links
// https://github.com/angrbrd/bamazon

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "bamazon"
});

connection.connect((err) => {
    if(err) throw err;
    querySearch();
});

function querySearch(){
    inquirer.prompt({
        type:"list",
        name: "action",
        message: "What would you like to do?",
        choices: [
            'View Products for Sale', 
            'View Low Inventory', 
            'Add to Inventory', 
            'Add New Product'
        ]
    }).then((answer) => {
        // detect what option was selected
        switch(answer.action){
            case "View Products for Sale":
                viewProducts();
                break;

            case "View Low Inventory":
                lowInventory();
                break;

            case "Add to Inventory":
                addInventory();
                break;

            case "Add New Product":
                newProduct();
                break;
        }
    });  
}

function viewProducts(){
    // list every available item: the item IDs, names, prices, and quantities.
    var query = "SELECT item_id, product_name, price, stock_quantity FROM products;";
    connection.query(query, (err, res) => {
        var table = new Table({
            head: ['item_id', 'product_name', 'price', 'stock_quantity']
        });

        console.log("HERE ARE ALL THE ITEMS AVAILABLE FOR SALE: ");
        console.log("===========================================");
        if (err) throw err;
        for (var i=0; i < res.length; i++){
            // instantiate
            table.push([res[i].item_id, res[i].product_name, res[i].price, res[i].stock_quantity]);
        }

        console.log(table.toString());
        console.log("-----------------------------------------------");
        querySearch();
    });
}

function lowInventory(){
    // list all items with an inventory count lower than five.
    var query = "SELECT * FROM products WHERE stock_quantity < 5";

    connection.query(query, (err, res) => {
        var table = new Table({
            head: ['item_id', 'product_name', 'department_name', 'price', 'stock_quantity']
        });

        console.log("LOW INVENTORY < 5: ");
        console.log("===========================================");
        if (err) throw err;
        if(res.length ===0){
            // no inventory less than 5
            console.log("There are currently no items with Low Inventory!");
        }else {
            for (var i=0; i < res.length; i++){
                // instantiate
                table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
            }
        }
        
        console.log(table.toString());
        console.log("-----------------------------------------------");
        querySearch();
    });
}

function addInventory() {
    var items = [];
    //GET ALL PRODUCTS FROM MYSQL
    connection.query('SELECT product_name FROM products', (err, res) => {
        if (err) throw err;
        //PUSH PRODUCTS IN INVENTORY TO ARRAY
        for (var i = 0; i < res.length; i++) {
            items.push(res[i].product_name)
        }
        //ASK USER WHICH ITEMS FROM SHOWN WOULD THEY LIKE TO UPDATE?
        inquirer.prompt([{
            name: 'choices',
            type: 'checkbox',
            message: 'Which product would you like to add inventory for? [only one item can be updated at a time]',
            choices: items
        }]).then((user) => {
            //IF NOTHING IS SELECTED RUN MANAGER PROMPT FUNCTION AGAIN
            if (user.choices.length === 0) {
                console.log('Oops! You didn\'t select anything!');
                addInventory();
            } else {
                addIventoryCont(user.choices);
            }
        });
    });
}

function addIventoryCont(itemName){
    var item = itemName.shift();
    var itemStock;

    // select qty from database
    connection.query('SELECT stock_quantity FROM products WHERE ?', {
        product_name: item
    }, function(err, res) {
        if (err) throw err;
        itemStock = res[0].stock_quantity;
        itemStock = parseInt(itemStock);
    });

    // ask user qty
    inquirer.prompt([{
        name: 'qty',
        type: 'input',
        message: `how many ${item} would you like to add?`,
        validate: (str) => {
        if (isNaN(parseInt(str))) {
            console.log('Sorry that is not a valid number!');
            return false;
        } else {
            return true;
        }
    }
    }]).then((user) => {
        var qty = parseInt(user.qty);
        if(qty <= 0) {
            console.log("please input number greater than 0");
            querySearch();
        }
        else{
            var query = "UPDATE products SET stock_quantity = ? WHERE product_name = ?";
            connection.query(query, [qty+itemStock, item], (err, res) => {
                if(err) throw err;
                console.log(`Inventory was updated successfully.`);
                querySearch();
            });
        }
    });
    
}

//THIS FUNCTION WILL ADD NEW PROCUTS TO THE TABLE. 
function newProduct() {
    var departments = [];
    //I ADDED A DEPARTMENT TABLE WITH DIFFERENT DEPARTMENTS WHICH WILL SHOW UP HERE. 
    connection.query('SELECT department_name FROM products', (err, res) => {
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
            departments.push(res[i].department_name);
        }
    });
    //THESE ARE ALL THE PROMPTS FOR THE USER TO BE PROMPTED.
    inquirer.prompt([{
        name: 'item',
        type: 'text',
        message: 'Please enter the name of the product that you would like to add.'
    }, {
        name: 'department',
        type: 'list',
        message: 'Please choose the department you would like to add your product to.',
        choices: departments
    }, {
        name: 'price',
        type: 'text',
        message: 'Please enter the price for this product.'
    }, {
        name: 'stock',
        type: 'text',
        message: 'Plese enter the Stock Quantity for this item to be entered into current Inventory'
    }]).then(function(user) {
        //CREATES AN OBJECT WITH ALL OF THE ITEMS ADDED
        var item = {
                product_name: user.item,
                department_name: user.department,
                price: user.price,
                stock_quantity: user.stock
            }
            //INSERTS THE NEW ITEM INTO THE DATABASE
        connection.query('INSERT INTO products SET ?', item,
            function(err) {
                if (err) throw err;
                console.log(item.product_name + ' has been added successfully to your inventory.');
                //THE MANAGER PROMPT FUNCTION IS RUN AGAIN.
                querySearch();
            });
    });
}