/**

* Filter Strategies
* Strategy Pattern:
* Each filter is separated into its own strategy object.
* This allows the application to switch filtering behavior dynamically
* without changing the main filtering logic.
*
* Open/Closed Principle (SOLID):
* New filter strategies can be added later
* without modifying existing code.
*
* DRY Principle:
* Filtering logic is centralized in one place
* instead of being repeated across the application.
  */

// Object containing all filtering strategies
export const FilterStrategies = {

// Returns all tasks without filtering
all: {
apply: (tasks) => tasks
},

// Returns only tasks with "pending" status
pending: {
apply: (tasks) =>
tasks.filter(t => t.status === 'pending')
},

// Returns only completed tasks
done: {
apply: (tasks) =>
tasks.filter(t => t.status === 'done')
},

// Returns only overdue tasks
overdue: {
apply: (tasks) =>
tasks.filter(t => t.isOverdue())
},

// Dynamic strategy:
// Filters tasks by selected subject
bySubject: (subject) => ({
apply: (tasks) =>
tasks.filter(t => t.subject === subject)
})
};

/**

* FilterContext
*
* Holds the currently active filtering strategy.
* The application does not need to know
* which filtering algorithm is being used.
*
* This demonstrates loose coupling and polymorphism.
  */
  export class FilterContext {

// Default strategy is "all"
constructor(strategy = FilterStrategies.all) {
this._strategy = strategy;
}

// Changes the active strategy dynamically
setStrategy(strategy) {
this._strategy = strategy;
}

// Applies the currently selected strategy
apply(tasks) {
return this._strategy.apply(tasks);
}
}



