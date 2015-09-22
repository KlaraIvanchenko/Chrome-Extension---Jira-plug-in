var projectOpenCounter = 0;

function projectDetails(pProjectKey, projectName, projectOpenIndex) {
	var params = getCookiesParameters();
	var promises = [];

	displayDetailsTabs(projectName);
	initBackButton(projectOpenCounter);

	$.ajax({
		url: 'https://toolchain.logicline.de/jira/browse/' + pProjectKey + '-1?jql=project%20%3D%20' + pProjectKey,
		method: 'GET',
		headers: {
			'Cookie': params
		},
		success: function(data) {
			var resultJSON = $.parseJSON($(data).find("div.navigator-content").attr("data-issue-table-model-state"));

			$.each(resultJSON.issueTable.issueKeys, function(index, issueKey) {
				promises.push($.ajax({
					url: 'https://toolchain.logicline.de/jira/browse/' + issueKey + '?page=com.atlassian.jira.plugin.system.issuetabpanels:worklog-tabpanel',
					method: 'GET',
					headers: {
						'Cookie': params
					},
					success: function(issuePage) {

						var workLogs = $(issuePage).find('#issue_actions_container').children('div[class="issue-data-block"]');
						var status = $.trim($(issuePage).find('#status-val').text());
						var issueLogs = {
							todayLogs : 0,
							yesterdatLogs : 0,
							weekLogs : 0
						};
						$.each(workLogs, function(index, workLog) {
							var name = $(workLog).find('.action-details').find('a').attr('rel');
							var issueDate = new Date($(workLog).find('.action-details').find('span.date').html());
							var spent = calcTimeWorkLog($(workLog).find('.action-body').find('dd.worklog-duration').html());
							var today = new Date();
							var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
							var weekdays = today.getDay();
							var diffDays = Math.round(Math.abs((issueDate.getTime() - today.getTime())/(oneDay)));
							
							if (diffDays == 0) {
								issueLogs.todayLogs += spent;
								issueLogs.weekLogs += spent;
							}
							else if (diffDays == 1) {
								issueLogs.yesterdatLogs += spent;
								issueLogs.weekLogs += spent;
							}
							else if (diffDays < weekdays) {
								issueLogs.weekLogs += spent;
							}
						});
						if (projectOpenIndex === projectOpenCounter) {			
							addIssuesToTabs(issueKey, issueLogs, status);
						}
						$.when.apply($, promises).then(function() {
							if (projectOpenIndex === projectOpenCounter) {
								removeSpinner('tasksUploading');
							} 
						});
					}
				}));
			});
		}
	});
};
