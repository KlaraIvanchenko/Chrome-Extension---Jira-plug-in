var currentProjectNumber = 0;
var projectOpenCounter = 0;
var statuses = [
	{urlValue : '"To%20Do"', issueStatus : 'toDo'},
	{urlValue : '"Open"', issueStatus : 'open'},
	{urlValue : '"Reopened"', issueStatus : 'reopened'},
	{urlValue : '"In%20Progress"', issueStatus : 'inprogress'},
	{urlValue : '"Closed"', issueStatus : 'closed'},
	{urlValue : '"Resolved"', issueStatus : 'resolved'}
];
var tabs = ['todayIssues', 'yesterdayIssues', 'weekIssues'];
var userOpenCounter = 0;
var users = new Map();

$(function() {
	$('a[data-toggle="tab"][data-target="#users"]').TabExtensions('push', $('#userUploading'));
});
function addIssues(pIssues, pIssueType, pProjectData) {
	
	var projectIssues = $(pProjectData).find("div.navigator-content").attr("data-issue-table-model-state");
	
	if (projectIssues.indexOf("\&quot;")) {
		projectIssues = projectIssues.split("\&quot;").join("\"");
	}	
	projectIssues = $.parseJSON(projectIssues);
	pIssues[pIssueType] = projectIssues.issueTable.end;
};
function addIssuesToTabs(pName, pIssueLogs, pStatus) {
	if (pIssueLogs.todayLogs) {
		displayIssues(pName, pIssueLogs.todayLogs, pStatus, 'todayIssues');	
	}
	if (pIssueLogs.yesterdatLogs) {
		displayIssues(pName, pIssueLogs.yesterdatLogs, pStatus, 'yesterdayIssues');	
	}
	if (pIssueLogs.weekLogs) {
		displayIssues(pName, pIssueLogs.weekLogs, pStatus, 'weekIssues');	
	}
};
function addUser(pNickName, pIssue, pUserName) {
	if (users.has(pNickName)) {
		if ($.inArray(pIssue, users.get(pNickName).issues) == -1) {
			users.get(pNickName).issues.push(pIssue);
		}
	} else {
		users.set(pNickName, {
			name : pUserName,
			issues: [pIssue],
			open: 0,
			inprogress: 0,
			resolved: 0,
		});
		var id = pNickName.replace(/\./, '');
		$("#usersArea").append('<a href="javascript:void(0)" class="list-group-item" id="' + id + '">' + pUserName + '</a>');
	}
};
function getCookiesParameters() {
	var params = '';
	chrome.cookies.getAll({},function (cookie) {
		var result = [];		
		for (var i = 0; i < cookie.length; i++) {
			result.push({"name": cookie[i].name, "value": cookie[i].value});
			params += ';' + cookie[i].name + '=' + cookie[i].value;
		}

		params = params.substring(1);
	});
	return params;
};
function getProjects() {
	var params = getCookiesParameters();

	$.ajax({
		url: 'https://toolchain.logicline.de/jira/secure/BrowseProjects.jspa?selectedCategory=all',
		method: 'GET',
		headers: {
			'Cookie': params
		},
		crossDomain: true,
		xhrFields: {
			withCredentials: true
		},
		success: function(data) {
			var startIndex = data.indexOf('com.atlassian.jira.project.browse:projects') + 'com.atlassian.jira.project.browse:projects"]="'.length;
			var projectsLogicLine = data.substring(startIndex, data.indexOf(';', startIndex) - 1);
			projectsLogicLine = projectsLogicLine.split("\\\"").join("\"").split("\\\"").join("\"");
			var projects = [];
			var promises = [];

			$.each($.parseJSON(projectsLogicLine), function(index, value) {
				var name = value.name;
				var key = value.key;						
				var project = $('<a href="javascript:void(0)" class="list-group-item" id="' + key + '" name="' + name + '">' + name + '</a>');
				
				projects.push(project);
				promises.push(getTasks(key, params));
			});

			$.when.apply($, promises).then(function() {
				$.each(projects, function(index, value){
					(function(key, name) {
						value.click(function() {
							projectDetails(key, name, projectOpenCounter);
							return false;
						});
					})(value.attr('id'), value.attr('name'));
				});
			});
			$.each(projects, function(index, value){
				$("#projectsArea").append(value);
			});
		},
		fail: function(data) {
			console.log("fail: ",data);
		}
	});
};
function getTasks(pProjectKey, pCookieParams, pPromises) {
	var issues = {};
	var promises = [];
	$.each(statuses, function(index, value) {
		promises.push(
			$.ajax({
				url: 'https://toolchain.logicline.de/jira/browse/' + pProjectKey + '-1?jql=project%20%3D%20' + pProjectKey + '%20AND%20status%20%3D%20' + value.urlValue,
				method: 'GET',
				headers: {
					'Cookie': pCookieParams
				},
				success: function(projectData) {
					addIssues(issues, value.issueStatus, projectData);
				}
			})
		);
	});
	var defer = $.Deferred();
	$.when.apply($, promises).then(function () {
		displayProjectProgress(issues, pProjectKey);
		defer.resolve(promises);
	});
	return defer.promise();
};
function getUsers() {
	var params = getCookiesParameters();
	$.ajax({
		url: 'https://toolchain.logicline.de/jira/secure/BrowseProjects.jspa?selectedCategory=all',
		method: 'GET',
		headers: {
			'Cookie': params
		},
		crossDomain: true,
		xhrFields: {
			withCredentials: true
		},
		success: function(data) {
			var startIndex = data.indexOf('com.atlassian.jira.project.browse:projects') + 'com.atlassian.jira.project.browse:projects"]="'.length;
			var projectsLogicLine = data.substring(startIndex, data.indexOf(';', startIndex) - 1);
			projectsLogicLine = projectsLogicLine.split("\\\"").join("\"").split("\\\"").join("\"");
			var countProjects = $.parseJSON(projectsLogicLine).length;
			var promises = [];
			var usersLinks = [];

			$.each($.parseJSON(projectsLogicLine), function(index, value) {
				var name = value.name;
				var projectKey = value.key;

				promises.push($.ajax({
					url: 'https://toolchain.logicline.de/jira/browse/' + projectKey + '-1?filter=-1&jql=project%20%3D%20' + projectKey + '%20AND%20updated%20>%3D%20-2w',
					method: 'GET',
					headers: {
						'Cookie': params
					},
					success: function(data) {
						var resultJSON = $.parseJSON($(data).find("div.navigator-content").attr("data-issue-table-model-state"));
						$.each(resultJSON.issueTable.issueKeys, function(index, value) {
							promises.push($.ajax({
								url: 'https://toolchain.logicline.de/jira/browse/' + value + '?page=com.atlassian.jira.plugin.system.issuetabpanels:worklog-tabpanel',
								method: 'GET',
								headers: {
									'Cookie': params
								},
								success: function(issuePage) {
									var nickName = $(issuePage).find('#assignee-val').find('.user-hover').attr('rel');
									var userName = $.trim($(issuePage).find('#assignee-val').find('.user-hover').text());
									var status = $.trim($(issuePage).find('#status-val').text());					
									var dateIssue = $(issuePage).find('span[data-name="Updated"] time').attr('datetime');
									var workLogs = $(issuePage).find('#issue_actions_container').children('div[class="issue-data-block"]');
									if ((typeof(nickName) != "undefined") && (userName != '') && isStatisticIssues(new Date(dateIssue))) {	
										addUser(nickName, value, userName);

										switch (status) {
											case "Open": 
											case "Reopened": {
												users.get(nickName).open++;
												break;
											}
											case "In Progress": {
												users.get(nickName).inprogress++;
												break;
											}
											case "Closed":
											case "Resolved": {
												users.get(nickName).resolved++;
												break;
											}
										}
									}					

									$.each(workLogs, function(index, val) {
										var nickNameWokrlog = $(val).find('.action-details').find('a.user-avatar').attr('rel');
										var nameWorklog = $.trim($(val).find('.action-details').find('a.user-avatar').text());
										var issueDate = new Date($(val).find('.action-details').find('span.date').html());
										if ((nickNameWokrlog != nickName) && (typeof(nickNameWokrlog) != "undefined") && isStatisticIssues(issueDate)) {
											addUser(nickNameWokrlog, value, nameWorklog);
										}
									});
								}
							}));
						});
						$.when.apply($, promises).then(function() {
							displayUserProgress(users, countProjects);
						});
					}
				}));
			});
		},
		fail: function(data) {
			console.log("fail: ",data);
		}
	});
};
function initBackButton(pTabOpenCounter) {
	$("a#back").click(function() {
		$("#mainView").show();
		$("#details").hide();
		pTabOpenCounter++;
		
		var dLabel = '<div id="defaultLabel">No data available.</div>';
		$.each(tabs, function(index, value) {
			$("#" + value).html(dLabel);
			$.each($("#" + value).find('a'), function(index, value) {
				value.remove();
			});
		});
		return false;
	});
};
function isStatisticIssues(pIssueDate) {
	var today = new Date();
	var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
	var weekdays = today.getDay();
	var diffDays = Math.round(Math.abs((pIssueDate.getTime() - today.getTime())/(oneDay)));	
	var isCurrentWeekIssue = (diffDays < weekdays) ? true : false;
	return isCurrentWeekIssue;
};
function userDetail(pNickName, pUserOpenIndex) {
	var params = getCookiesParameters();
	var promises = [];

	displayDetailsTabs(users.get(pNickName).name);
	initBackButton(userOpenCounter);

	$.each(users.get(pNickName).issues, function(index, issueName) {
		promises.push($.ajax({
			url: 'https://toolchain.logicline.de/jira/browse/' + issueName + '?page=com.atlassian.jira.plugin.system.issuetabpanels:worklog-tabpanel',
			method: 'GET',
			headers: {
				'Cookie': params
			},
			success: function(issuePage) {
				var issueLogs = {
					todayLogs : 0,
					yesterdatLogs : 0,
					weekLogs : 0
				};
				var status = $.trim($(issuePage).find('#status-val').text());
				var workLogs = $(issuePage).find('#issue_actions_container').children('div[class="issue-data-block"]');
				
				$.each(workLogs, function(index, workLog) {
					var name = $(workLog).find('.action-details').find('a').attr('rel');
					if (pNickName == name) {
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
					}
				});

				if (pUserOpenIndex === userOpenCounter) {
					addIssuesToTabs(issueName, issueLogs, status);
				}
			}
		}));
	});
	$.when.apply($, promises).done(function() {
		if (pUserOpenIndex === userOpenCounter) {
			removeSpinner('tasksUploading');
			$.each(tabs, function(index, value) {
				displayTotal(value);
			});
		}
	});
};
function removeSpinner(pElementId) {
	$('#' + pElementId).hide();
};