var mysql = require('mysql');
var inquirer = require('inquirer');
const cTable = require('console.table');



var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "bamazon"
});

connection.connect((err) => {
    if(err) throw err;
    print();
});

function print(){
    var resArray = [];
    var query = "SELECT * FROM bamazon.products;";
    connection.query(query, (err, res) => {
        if(err) throw err;
        for( var i = 0; i < res.length; i++){
            var results = 
            {
                "item_id" : res[i].item_id,
                "product_name" : res[i].product_name,
                "price" : res[i].price
            };

            resArray.push(results);
            //console.log("item_id: " + res[i].item_id + "\nproduct_name: " + res[i].product_name + "\ndepartment_name: " + res[i].department_name
            //+ "\nprice: $" + res[i].price + "\nstock_quantity: " + res[i].stock_quantity + "\n-----------\n");
        }
        console.table(resArray);
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
            var itemID = answer.item_id - 1;
            // quantity to buy
            var qtyToBuy = answer.quantity;
            
            // item price
            var price = res[itemID].price;
    
            var totalAmount = price * qtyToBuy;
            
            var newStockQty = res[itemID].stock_quantity - qtyToBuy;
    
            if(qtyToBuy < res[0].stock_quantity){
                var query = "UPDATE Products SET stock_quantity = ? WHERE item_id = ?";
                connection.query(query, [newStockQty,itemID], (err, res) => {
                    if(err) throw err;
                    console.log(`Your total is: $${totalAmount.toFixed(2)}`);
                    print();
                });
            }
            else {
                console.log("Insufficient quantity!");
                print();
            }
        });
    });   
}

var runSearch = function(){
    
}