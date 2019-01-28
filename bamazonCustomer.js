var mysql = require('mysql');
var inquirer = require('inquirer');
var Table = require('cli-table');


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
    var query = "SELECT * FROM products;";
    connection.query(query, (err, res) => {
        var table = new Table({
            head: ['item_id', 'product_name', 'department_name', 'price', 'stock_quantity']
        });
        if(err) throw err;
        for( var i = 0; i < res.length; i++){
            table.push([res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
        }
        console.log(table.toString());
        inquirer.prompt([
        {
            type:"input",
            name:"item_id",
            message:"Enter the ID of the product you would like to buy: ",
            validate: (value) => {
                if(isNaN(value)==false) return true;
                else return false;
            }
        },
        {
            type:"input",
            name:"quantity",
            message:"Enter how many units of the product you would like to buy: ",
            validate: (value) => {
                if(isNaN(value)==false) return true;
                else return false;
            }
        }
        ]).then((answer) => {
            // id of item to buy
            var itemID = answer.item_id;
            // quantity to buy
            var qtyToBuy = answer.quantity;

            // NEW STUFF
            // Query db to confirm that the given item ID exists in the desired quantity
            var queryStr = 'SELECT * FROM products WHERE ?';
            
            connection.query(queryStr, {item_id: itemID}, (err, data) => {
                if (err) throw err;

                // If the user has selected an invalid item ID, data attay will be empty
                if (data.length === 0) {
                    console.log('ERROR: Invalid Item ID. Please select a valid Item ID.');
                    displayInventory();
    
                } else {
                    var productData = data[0];

                    // If the quantity requested by the user is in stock
                    if (qtyToBuy <= productData.stock_quantity) {
                        console.log('Congratulations, the product you requested is in stock! Placing order!');

                        var newStockQty = productData.stock_quantity - qtyToBuy;

                        // Construct the updating query string
                        var updateQueryStr = 'UPDATE products SET stock_quantity = ' + newStockQty + ' WHERE item_id = ' + itemID;
                        
                        // Update the inventory
                        connection.query(updateQueryStr, (err, data) => {
                            if (err) throw err;

                            querySearch();
                        });
                    } else {
                        console.log("Insufficient quantity!");
					    querySearch();
                    }
                }
            });
        });
    });   
}