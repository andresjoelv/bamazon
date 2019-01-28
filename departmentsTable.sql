USE bamazon;

CREATE TABLE departments (
  department_id INT AUTO_INCREMENT,
  department_name VARCHAR(45) NOT NULL,
  over_head_costs INT NOT NULL,
  PRIMARY KEY (department_id)
);