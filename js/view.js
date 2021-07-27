/*global qs, qsa, $on, $parent, $delegate */


	'use strict';

	/**
           * @constructor
           * @param {string} template HTML String of a li element
	     * View that abstracts away the browser's DOM completely.
	     * It has two simple entry points:
	     *   - bind(eventName, handler)
	     *     Takes a todo application event and registers the handler
	     *   - render(command, parameterObject)
	     *     Renders the given command with the options
	     */
	function View(template) {
		this.template = template;

		this.ENTER_KEY = 13;
		this.ESCAPE_KEY = 27;

		this.$todoList = qs('.todo-list');
		this.$todoItemCounter = qs('.todo-count');
		this.$clearCompleted = qs('.clear-completed');
		this.$main = qs('.main');
		this.$footer = qs('.footer');
		this.$toggleAll = qs('.toggle-all');
		this.$newTodo = qs('.new-todo');
	}

      /**
	 * Delete the todo depending on ID
	 * @param {number} (id) Deleting element ID.
	*/
	View.prototype._removeItem = function (id) {
		var elem = qs('[data-id="' + id + '"]');

		if (elem) {
			this.$todoList.removeChild(elem);
		}
	};

      /**
	 * Hide the finished elements.
	 * @param  {number} (completedCount) number of elements ticked.
	 * @param  {bolean} (visible) True if visible
	 */
	View.prototype._clearCompletedButton = function (completedCount, visible) {
		this.$clearCompleted.innerHTML = this.template.clearCompletedButton(completedCount);
		this.$clearCompleted.style.display = visible ? 'block' : 'none';
	};

      /**
	 * Show the current page
	 * @param {string} (currentPage) Current page may have values as '' || active || completed.
	 */
	View.prototype._setFilter = function (currentPage) {
		qs('.filters .selected').className = '';
		qs('.filters [href="#/' + currentPage + '"]').className = 'selected';
	};

      /**
	 * Testing if the element is over
	 * @param  {number} (id) ID of tested element.
	 * @param  {bolean} (completed) element status.
	 */
	View.prototype._elementComplete = function (id, completed) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = completed ? 'completed' : '';

		// In case it was toggled from an event and not by clicking the checkbox
		qs('input', listItem).checked = completed;
	};

      /**
	 * Edit an element
	 * @param  {number} (id) ID of the editing element
	 * @param  {string} (title) new content of the element
	 */
	View.prototype._editItem = function (id, title) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = listItem.className + ' editing';

		var input = document.createElement('input');
		input.className = 'edit';

		listItem.appendChild(input);
		input.focus();
		input.value = title;
	};

      /**
	 * Replace former element by edited element.
	 * @param  {number} (id) ID of the element to edit
	 * @param  {string} (title) modified content of the element
	 */
	View.prototype._editItemDone = function (id, title) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		var input = qs('input.edit', listItem);
		listItem.removeChild(input);

		listItem.className = listItem.className.replace('editing', '');

		qsa('label', listItem).forEach(function (label) {
			label.textContent = title;
		});
	};

      /**
	 * Return elements within the DOM
	 * @param  {string} (viewCmd)   The active function.
	 * @param  {object} (parameter) The active parameters.
	 */
	View.prototype.render = function (viewCmd, parameter) {
		var self = this;
		var viewCommands = {
                  /**
			 * Display the elements
			 */
			showEntries: function () {
				self.$todoList.innerHTML = self.template.show(parameter);
			},
                  /**
			 * Delete the element
			 */
			removeItem: function () {
				self._removeItem(parameter);
			},
                  /**
			 * Update the counter 
			 */
			updateElementCount: function () {
				self.$todoItemCounter.innerHTML = self.template.itemCounter(parameter);
			},
                  /**
			 * Display 'clearCompleted' button
			 */
			clearCompletedButton: function () {
				self._clearCompletedButton(parameter.completed, parameter.visible);
			},
                  /**
			 * Check element's visibility 
			 */
			contentBlockVisibility: function () {
				self.$main.style.display = self.$footer.style.display = parameter.visible ? 'block' : 'none';
			},
                  /**
			 * Display all elements
			 */
			toggleAll: function () {
				self.$toggleAll.checked = parameter.checked;
			},
                  /**
			 * Filter elements
			 */
			setFilter: function () {
				self._setFilter(parameter);
			},
			/**
			 * Clean the new todo content inside the input
			 */
                   clearNewTodo: function () {
				self.$newTodo.value = '';
			},
			/**
			 * Diplay completed element
			 */
			elementComplete: function () {
				self._elementComplete(parameter.id, parameter.completed);
			},
			/**
			 * Edit element
			 */
			editItem: function () {
				self._editItem(parameter.id, parameter.title);
			},
			/**
			 * Save element edition
			 */
			editItemDone: function () {
				self._editItemDone(parameter.id, parameter.title);
			}
		};

		viewCommands[viewCmd]();
	};

      /**
	 * Add an ID to an element
	 * @param  {object} (element) Current element.
	 */
	View.prototype._itemId = function (element) {
		var li = $parent(element, 'li');
		return parseInt(li.dataset.id, 10);
	};

      /**
	 * EventListener sur la validation de l' édition d'un élément. EventListener on validating editing element.
	 * @param  {function} (handler) An executed callback under conditions.
	 */
	View.prototype._bindItemEditDone = function (handler) {
		var self = this;
		$delegate(self.$todoList, 'li .edit', 'blur', function () {
			if (!this.dataset.iscanceled) {
				handler({
					id: self._itemId(this),
					title: this.value
				});
			}
		});

		$delegate(self.$todoList, 'li .edit', 'keypress', function (event) {
			if (event.keyCode === self.ENTER_KEY) {
				// Remove the cursor from the input when you hit enter just like if it
				// were a real form
				this.blur();
			}
		});
	};

      /**
	 * EventListener on cancelling editing element.
	 * @param  {function} (handler) An executed callback under conditions.
	 */
	View.prototype._bindItemEditCancel = function (handler) {
		var self = this;
		$delegate(self.$todoList, 'li .edit', 'keyup', function (event) {
			if (event.keyCode === self.ESCAPE_KEY) {
				this.dataset.iscanceled = true;
				this.blur();

				handler({id: self._itemId(this)});
			}
		});
	};

      /**
	 * Make the link between {@link Controller} methods and {@link View} elements.
	 * @param  {function} (event)  the current event.
	 * @param  {function} (handler) An executed callback under conditions.
	 */
	View.prototype.bind = function (event, handler) {
		var self = this;
		if (event === 'newTodo') {
			$on(self.$newTodo, 'change', function () {
				handler(self.$newTodo.value);
			});

		} else if (event === 'removeCompleted') {
			$on(self.$clearCompleted, 'click', function () {
				handler();
			});

		} else if (event === 'toggleAll') {
			$on(self.$toggleAll, 'click', function () {
				handler({completed: this.checked});
			});

		} else if (event === 'itemEdit') {
			$delegate(self.$todoList, 'li label', 'dblclick', function () {
				handler({id: self._itemId(this)});
			});

		} else if (event === 'itemRemove') {
			$delegate(self.$todoList, '.destroy', 'click', function () {
				handler({id: self._itemId(this)});
			});

		} else if (event === 'itemToggle') {
			$delegate(self.$todoList, '.toggle', 'click', function () {
				handler({
					id: self._itemId(this),
					completed: this.checked
				});
			});

		} else if (event === 'itemEditDone') {
			self._bindItemEditDone(handler);

		} else if (event === 'itemEditCancel') {
			self._bindItemEditCancel(handler);
		}
	};

	// Export to window
	window.app = window.app || {};
	window.app.View = View;

