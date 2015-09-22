$.fn.extend({
	'TabExtensions': function() {
		var tabLink = $(this);

		var getExtensions = function() {
			if (typeof tabLink.data('extensions.tabExtensions') === 'undefined') {
				tabLink.data('extensions.tabExtensions', []);
			}
			return tabLink.data('extensions.tabExtensions');
		};

		if (!tabLink.data('initialized.tabExtensions')) {
			tabLink.data('initialized.tabExtensions', true);
			tabLink.on('shown.bs.tab', function() {
				$.each(getExtensions(), function(i, extension) {
					extension.show();
				})
			});
			tabLink.on('hidden.bs.tab', function() {
				$.each(getExtensions(), function(i, extension) {
					extension.hide();
				})
			});
		}

		var methodApplier = new jqMethodApplier({
			'count': function() {
				return getExtensions().length;
			},
			'pop': function() {
				return getExtensions().pop();
			},
			'push': function(selector) {
				var extension = $(selector);
				if (tabLink.parent('li').hasClass('active')) {
					extension.show();
				} else {
					extension.hide();
				}
				return getExtensions().push(extension);
			}
		});
		return methodApplier.apply(arguments);
	}
});