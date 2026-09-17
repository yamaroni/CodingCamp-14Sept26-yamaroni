# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that helps a single user track spending and visualize where money goes. The user enters transactions (item name, amount, and category), views them in a scrollable list, sees a running total balance, and observes a pie chart that breaks down spending by category. All data is stored in the browser using the Local Storage API, so no backend server is required. The application is built with HTML, CSS, and vanilla JavaScript, and is intended to work as either a standalone web app or a browser extension in modern browsers.

## Glossary

- **Visualizer**: The overall Expense & Budget Visualizer web application, composed of the components below.
- **Input_Form**: The component that collects a new transaction's Item Name, Amount, and Category and submits it.
- **Transaction**: A single spending record consisting of an item name, an amount, and a category.
- **Item_Name**: A text label describing a Transaction (for example, "Lunch").
- **Amount**: A numeric monetary value associated with a Transaction.
- **Category**: The classification of a Transaction, one of the fixed set: Food, Transport, Fun.
- **Transaction_List**: The component that displays all stored Transactions and allows deletion.
- **Balance_Display**: The component that shows the total balance derived from all stored Transactions.
- **Total_Balance**: The sum of the Amount values across all stored Transactions.
- **Spending_Chart**: The pie chart component that shows spending distribution by Category.
- **Storage**: The browser Local Storage used to persist all Transactions client-side.
- **Modern_Browser**: A current version of Chrome, Firefox, Edge, or Safari.

## Requirements

### Requirement 1: Add a Transaction via the Input Form

**User Story:** As a user, I want to enter an item name, amount, and category and submit them, so that I can record a new expense.

#### Acceptance Criteria

1. THE Input_Form SHALL provide an input field for Item_Name that accepts 1 to 100 characters, an input field for Amount, and a selection control for Category limited to the values Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with Item_Name containing 1 to 100 characters, Amount as a positive number in the range 0.01 to 999,999,999.99, and Category set to one of Food, Transport, or Fun, THE Visualizer SHALL create a Transaction from the provided values and add the Transaction to the Transaction_List.
3. WHEN a Transaction is added to the Transaction_List, THE Visualizer SHALL clear the Item_Name, Amount, and Category fields of the Input_Form so the user can enter another Transaction.
4. IF the user submits the Input_Form while Item_Name is empty, Amount is empty, or Category is unselected, THEN THE Input_Form SHALL reject the submission, retain all entered field values, and display a validation message identifying each field that requires input.
5. IF the user submits the Input_Form with an Amount that is not a number, is less than or equal to 0, or is greater than 999,999,999.99, THEN THE Input_Form SHALL reject the submission, retain all entered field values, and display a validation message indicating that Amount must be a positive number between 0.01 and 999,999,999.99.

### Requirement 2: Display and Delete Transactions

**User Story:** As a user, I want to see all my transactions in a scrollable list and remove ones I no longer want, so that I can review and correct my spending records.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each stored Transaction showing its Item_Name, its Amount formatted as a numeric value with exactly two decimal places, and its Category.
2. WHERE the number of stored Transactions exceeds the visible area, THE Transaction_List SHALL provide vertical scrolling to access all Transactions.
3. THE Transaction_List SHALL provide a delete control for each displayed Transaction.
4. WHEN the user activates the delete control for a Transaction, THE Visualizer SHALL remove that Transaction from both the displayed Transaction_List and the stored Transaction records so that the removed Transaction does not reappear after the list is reloaded.
5. WHILE no Transactions are stored, THE Transaction_List SHALL display a message indicating that no transactions exist.
6. WHEN the user deletes the last remaining stored Transaction, THE Transaction_List SHALL display the message indicating that no transactions exist.

### Requirement 3: Display Total Balance

**User Story:** As a user, I want to see my total balance at the top of the page, so that I always know the sum of my recorded spending.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the Total_Balance, computed as the sum of Amount across all stored Transactions, at the top of the Visualizer.
2. WHEN a Transaction is added, THE Balance_Display SHALL update the Total_Balance to reflect the added Transaction within 500 milliseconds.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update the Total_Balance to reflect the removed Transaction within 500 milliseconds.
4. WHILE no Transactions are stored, THE Balance_Display SHALL show a Total_Balance of zero.
5. THE Balance_Display SHALL show the Total_Balance rounded to two decimal places, with a value bounded between -999,999,999.99 and 999,999,999.99.
6. WHEN the Total_Balance is negative, THE Balance_Display SHALL show the value with a visible negative indication that distinguishes it from a non-negative value.

### Requirement 4: Visualize Spending by Category

**User Story:** As a user, I want a pie chart of my spending by category, so that I can see how my money is distributed across Food, Transport, and Fun.

#### Acceptance Criteria

1. THE Spending_Chart SHALL display a pie chart with one slice per Category (Food, Transport, Fun) that has a total Amount greater than 0, where each slice size represents that Category's percentage of total spending, rounded to one decimal place, and the sum of displayed percentages equals 100.0% (with rounding differences of at most 0.1% allocated to the largest slice).
2. WHEN a Transaction is added, THE Spending_Chart SHALL update within 1 second to include the added Transaction's Amount in its Category's slice and recalculate all Category percentages.
3. WHEN a Transaction is deleted, THE Spending_Chart SHALL update within 1 second to remove the deleted Transaction's Amount from its Category's slice and recalculate all Category percentages.
4. WHILE no Transactions are stored OR the total Amount across all stored Transactions equals 0, THE Spending_Chart SHALL display an empty state with a visible message indicating that no spending data exists and SHALL NOT render any pie slices.
5. IF a Category has a total Amount of 0 while at least one other Category has a total Amount greater than 0, THEN THE Spending_Chart SHALL omit that Category's slice from the pie chart.

### Requirement 5: Persist Data in Local Storage

**User Story:** As a user, I want my transactions to remain after I close and reopen the app, so that I do not lose my records.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE Visualizer SHALL persist all stored Transactions to Storage within 1 second of the add operation completing.
2. WHEN a Transaction is deleted, THE Visualizer SHALL persist the updated set of stored Transactions to Storage within 1 second of the delete operation completing.
3. WHEN the Visualizer loads, THE Visualizer SHALL read the stored Transactions from Storage and render the Transaction_List, Balance_Display, and Spending_Chart from those Transactions.
4. IF the Visualizer loads and Storage contains no stored Transactions, THEN THE Visualizer SHALL initialize with an empty set of Transactions.
5. IF the Visualizer loads and the stored Transactions data cannot be parsed or fails validation as a well-formed set of Transactions, THEN THE Visualizer SHALL initialize with an empty set of Transactions and display a message indicating that stored data could not be read, without overwriting the existing Storage contents until the next successful persist operation.
6. IF a persist operation to Storage fails due to a write error or exceeded storage quota, THEN THE Visualizer SHALL retain the in-memory set of Transactions unchanged and display a message indicating that changes could not be saved.

### Requirement 6: Platform and Presentation Constraints

**User Story:** As a user, I want a clean, fast, and readable interface that runs in my browser, so that the app is pleasant and simple to use.

#### Acceptance Criteria

1. THE Visualizer SHALL run using only HTML, CSS, and vanilla JavaScript without a backend server, comprising exactly one CSS file located in the css/ directory and exactly one JavaScript file located in the js/ directory.
2. THE Visualizer SHALL operate in each Modern_Browser, where Modern_Browser is defined as the current stable release of Chrome, Firefox, Edge, and Safari.
3. THE Visualizer SHALL present the Total_Balance positioned above the Transaction_List and Spending_Chart, with body text rendered at a minimum font size of 14 pixels.
4. WHEN the user adds a Transaction, THE Visualizer SHALL update the Transaction_List, Balance_Display, and Spending_Chart within 200 milliseconds.
5. WHEN the user deletes a Transaction, THE Visualizer SHALL update the Transaction_List, Balance_Display, and Spending_Chart within 200 milliseconds.
6. IF the Visualizer fails to render in a Modern_Browser due to an unsupported feature, THEN THE Visualizer SHALL display a visible message indicating the browser is unsupported and SHALL retain any previously entered Transaction data.
