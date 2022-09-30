const inquirer = require('inquirer');

require("console.table");

const db = require("./db/connection");
const util = require("util");
db.query = util.promisify(db.query);


const viewDepartments = function () {
    db.query("SELECT department.id AS ID, department.name AS 'Department Name' FROM department", (err, result) => {
        if (err) {
            console.log(err);
        }
        console.table(result);
        nav();
    })
};

const viewRoles = function () {
    db.query("SELECT role.id AS 'Role ID', department.name AS 'Department Name', role.title AS Title, role.salary AS Salary FROM role JOIN department ON department.id = role.department_id", (err, result) => {
        if (err) {
            console.log(err);
        }
        console.table(result);
        nav();

    });
};

const viewEmployees = function () {
    db.query("SELECT employee.id AS ID, employee.first_name AS 'First Name', employee.last_name AS 'Last Name', role.title AS Title, role.salary AS Salary, department.name AS Department, concat(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON manager.id = employee.manager_id", (err, result) => {
        if (err) {
            console.log(err);
        }
        console.table(result);
        nav();

    });

};

const viewEmpbyDepartments = function () {
    db.query("SELECT * FROM department", (err, res)=> {
        let departmentList = res.map(({ id, name }) => ({ value: id, name: name }));

        inquirer
        .prompt([
            {
                type: "list",
                name: "department",
                message: "Please select what department's employees would you like to view?",
                choices: departmentList
            }
        ])
        .then((answer)=>{
            db.query("SELECT CONCAT(employee.first_name, ' ', employee.last_name) AS name, role.title AS title, role.salary AS salary, department.name AS department, CONCAT(manager.first_name, ' ', manager.last_name) as manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON manager.id = employee.manager_id WHERE department_id = ?", answer.department, 
            (err, res) => {
                if (err) {console.log (err)} else {console.table(res);
                    nav();}
            })
        })
    })

};


const addDepartment = function () {
    inquirer
        .prompt([
            {
                type: "input",
                name: "department",
                message: "What is the name of the department?",
            }
        ])
        .then(function (answer) {
            db.query("INSERT INTO department(name) VALUES (?)", answer.department, (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log("Department Added!");
                nav();
            })
        })
};


const addRole = function () {
    var departmentList;

    db.query("SELECT id, name FROM department")
        .then((result, error) => {
            departmentList = result.map(({ id, name }) => ({ value: id, name: name }));

            return departmentList;
        })
        .then((departmentList) => {
            inquirer
                .prompt([
                    {
                        type: "input",
                        name: "role",
                        message: "What is the name of the role?"
                    },
                    {
                        type: "input",
                        name: "salary",
                        message: "What is the salary of the role?"
                    },
                    {
                        type: "list",
                        name: "departmentID",
                        message: "What department does this belong to?",
                        choices: departmentList
                    }
                ])
                .then((answer) => {
                    db.query("INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)", [answer.role, answer.salary, answer.departmentID], (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Role Added!");
                            nav();
                        }
                    })
                }
                )
        }
        )

};

const addEmployee = function () {

    db.query("SELECT * FROM department", (err, depRes) => {

        let departmentList = depRes.map(({ id, name }) => ({ value: id, name: name }));

        inquirer
            .prompt([
                {
                    type: "input",
                    name: "firstName",
                    message: "What is the employee's first name?"
                },
                {
                    type: "input",
                    name: "lastName",
                    message: "What is the employee's last name?"
                },
                {
                    type: "list",
                    name: "department",
                    message: "What department does the employee belong to?",
                    choices: departmentList
                }
            ])

            .then((answer1) => {

                db.query("SELECT id, title FROM role WHERE department_id = ?", answer1.department, (err, rolRes) => {

                    let roleList = rolRes.map(({ id, title }) => ({ value: id, name: title }));

                    db.query("SELECT CONCAT(first_name, ' ', last_name) AS name, id from employee", (err, empRes) => {

                        let managerList = empRes.map(({ name, id }) => ({ value: id, name: name }));
                        managerList.push({ value: null, name: "No Manager" });

                        inquirer
                        .prompt([
                            {
                                type: "list",
                                name: "role",
                                message: "What is the employee's position?",
                                choices: roleList
                            },
                            {
                                type: "list",
                                name: "manager",
                                message: "Who is the employee's manager?",
                                choices: managerList
                            }
                        ])

                        .then((answer2) => {

                            db.query("INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)", [answer1.firstName, answer1.lastName, answer2.role, answer2.manager],
                            (err, res) => {
                                if (err) {console.log(err)} else { console.log("Employee added!")};
                            })

                            nav();

                        })

                    })
                    

                }

                )
            })


    })
}




const updateEmployee = function () {

    db.query("SELECT CONCAT(first_name, ' ', last_name) AS NAME, id from employee", (error, empRes) => {

        let employeeList = empRes.map(({ NAME, id }) => ({ value: id, name: NAME }));
        let managerList = empRes.map(({ NAME, id }) => ({ value: id, name: NAME }));
        managerList.push({ value: null, name: "No Manager" });


        db.query("SELECT id, title FROM role", (error, rolRes) => {

            let roleList = rolRes.map(({ id, title }) => ({ value: id, name: title }));


            inquirer.prompt([
                {
                    type: "list",
                    name: "employee",
                    message: "Which employee would you like to update?",
                    choices: employeeList
                },
                {
                    type: "list",
                    name: "role",
                    message: "What is this employee's updated role?",
                    choices: roleList
                },
                {
                    type: "list",
                    name: "manager",
                    message: "Who is this employee's manager?",
                    choices: managerList
                }
            ])
                .then(function (answer) {
                    db.query("UPDATE employee SET role_id = ?, manager_id = ? WHERE id = ?", [answer.role, answer.manager, answer.employee],
                        (err, res) => { if (err) { console.log(err) } else { console.log("success!") } }
                    );
                    nav();

                }
                )

        })

    })



}

function nav() {

    inquirer
        .prompt([
            {
                type: "list",
                name: "nav",
                message: "What would you like to do?",
                choices: ['view all departments',
                    'view all roles',
                    'view all employees',
                    'view employees by department',
                    'add a department',
                    'add a role',
                    'add an employee',
                    'update an employee role',
                    'quit']
            }
        ])
        .then(function (answer) {
            switch (answer.nav) {
                case 'view all departments':
                    viewDepartments();
                    break;
                case 'view all roles':
                    viewRoles();
                    break;
                case 'view all employees':
                    viewEmployees();
                    break;
                    case 'view employees by department':
                        viewEmpbyDepartments();
                        break;
                case 'add a department':
                    addDepartment();
                    break;
                case 'add a role':
                    addRole();
                    break;
                case 'add an employee':
                    addEmployee();
                    break;
                case 'update an employee role':
                    updateEmployee();
                    break;
                default:
                    console.log("Thank you for using our application!");
                    return
            }
        })


}

nav();
