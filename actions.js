var users = new Map();
var currentProjectNumber = 0;
var userOpenCounter = 0;
var projectOpenCounter = 0;

$(function() {
	$('a[data-toggle="tab"][data-target="#users"]').TabExtensions('push', $('#userUploading'));
});

function userDetail(nickName, userOpenIndex) {
	$("#mainView").hide();
	$("#userDetail").show();
	$('#tasksUploading').show();

	$("#detail").find("div").html('<span>' + users.get(nickName).name + '</span>');
	
	var tabs = ['todayIssues', 'yesterdayIssues', 'tasks'];

	$("a#back").click(function() {
		$("#mainView").show();
		$("#userDetail").hide();
		userOpenCounter++;
		
		var dLabel = '<div id="defaultLabel">No data available.</div>';
		$.each(tabs, function(index, value) {
			$("#" + value).html(dLabel);
			$.each($("#" + value).find('a'), function(index, value) {
				value.remove();
			});
		});
		return false;
	});
	console.log('nickName---', nickName, ' issues---', users.get(nickName).issues);
	chrome.cookies.getAll({},function (cookie) {
		var result = [];
		var params = '';
		for (var i = 0; i < cookie.length; i++) {
			result.push({"name": cookie[i].name, "value": cookie[i].value});
			params += ';' + cookie[i].name + '=' + cookie[i].value;
		}

		params = params.substring(1);
		var promises = [];
		$.each(users.get(nickName).issues, function(index, value) {
			promises.push($.ajax({
				url: 'https://jira.codeswat.com/browse/' + value + '?page=com.atlassian.jira.plugin.system.issuetabpanels:worklog-tabpanel',
				method: 'GET',
				headers: {
					'Cookie': params
				},
				success: function(issuePage) {
					var projectName = $.trim($(issuePage).find('#project-name-val').text());
					var dateUpdate = $(issuePage).find('#datesmodule').find('.item-details').find('.dates').eq(1).find('dd').attr('title');

					var workLogs = $(issuePage).find('#issue_actions_container').children('div[class="issue-data-block"]');
					var status = $.trim($(issuePage).find('#status-val').text());
					var todayLogs = 0;
					var yesterdatLogs = 0;
					var weekLogs = 0;
					$.each(workLogs, function(index, val) {
						var name = $(val).find('.action-details').find('a').attr('rel');
						if (nickName == name) {
							var date = $(val).find('.action-details').find('span.date').html();

							var spent = $(val).find('.action-body').find('dd.worklog-duration').html();
							spent = calcTimeWorkLog(spent);

							var issueDate = new Date(date);
							var today = new Date();
							var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
							var weekdays = today.getDay();
							//console.log('issueDate= ', issueDate);
							//console.log('today= ', today);
							var diffDays = Math.round(Math.abs((issueDate.getTime() - today.getTime())/(oneDay)));
							//console.log('value', value, 'diffDays' , diffDays);
							if (diffDays == 0) {
								todayLogs += spent;
								weekLogs += spent;
							}
							else if (diffDays == 1) {
								yesterdatLogs += spent;
								weekLogs += spent;
							}
							else if (diffDays < weekdays) {
								weekLogs += spent;
							}
						}
					});

					if (userOpenIndex === userOpenCounter) {
						if (todayLogs) {
							displayIssues(value, todayLogs, status, 'todayIssues');	
						}
						if (yesterdatLogs) {
							displayIssues(value, yesterdatLogs, status, 'yesterdayIssues');	
						}
						if (weekLogs) {
							displayIssues(value, weekLogs, status, 'tasks');	
						}
					}
				}
			}));
		});
		$.when.apply($, promises).done(function() {
			if (userOpenIndex === userOpenCounter) {
				removeSpinner();
				$.each(tabs, function(index, value) {
					displayTotal(value);
				});
			}
		});
	});
};

function isStatisticIssues(issueDate) {
	var today = new Date();
	var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
	var weekdays = today.getDay();
	//console.log('issueDate= ', issueDate);
	//console.log('today= ', today);
	var diffDays = Math.round(Math.abs((issueDate.getTime() - today.getTime())/(oneDay)));
	
	if (diffDays < weekdays) {
		return true;
	} else {
		return false;
	}
};

function removeSpinner() {
	$('#tasksUploading').hide();
};

function getUsers() {
	chrome.cookies.getAll({},function (cookie) {
		var result = [];
		var params = '';
		for (var i = 0; i < cookie.length; i++) {
			result.push({"name": cookie[i].name, "value": cookie[i].value});
			params += ';' + cookie[i].name + '=' + cookie[i].value;
		}

		params = params.substring(1);

		$.ajax({
			url: 'https://jira.codeswat.com/secure/BrowseProjects.jspa?selectedCategory=all',
			method: 'GET',
			headers: {
				'Cookie': params
			},
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				var startIndex = data.lastIndexOf('<tbody class="projects-list">');
				var endIndex = data.lastIndexOf('<footer id="footer" role="contentinfo">');
				var projectsCodeSwat = '<div><div><div><div><table>' + data.substring(startIndex, endIndex);
				var projectsParse = $(projectsCodeSwat).find('.projects-list').find('tr');

				var usersLinks = [];				
				var promises = [];
				var countProjects = projectsParse.length;
				//console.log('projectsParse.length;  ', projectsParse);
				$.each(projectsParse, function(index, value) {
					var name = $.trim($(value).find('[data-cell-type="name"]').text());
					var key = $.trim($(value).find('[data-cell-type="name"]').next().text());

					promises.push($.ajax({
						url: 'https://jira.codeswat.com/browse/' + key + '-1?filter=-1&jql=project%20%3D%20"' + key + '"%20AND%20updated%20>%3D%20-2w',
						method: 'GET',
						headers: {
							'Cookie': params
						},
						success: function(data) {
							var resultJSON = $.parseJSON($(data).find("div.navigator-content").attr("data-issue-table-model-state"));

							$.each(resultJSON.issueTable.issueKeys, function(index, value) {
								promises.push($.ajax({
									url: 'https://jira.codeswat.com/browse/' + value + '?page=com.atlassian.jira.plugin.system.issuetabpanels:worklog-tabpanel',
									method: 'GET',
									headers: {
										'Cookie': params
									},
									success: function(issuePage) {
										var nickName = $(issuePage).find('#assignee-val').find('.user-hover').attr('rel');
										var userName = $.trim($(issuePage).find('#assignee-val').find('.user-hover').text());
										var status = $.trim($(issuePage).find('#status-val').text());	
										var d = $(issuePage).find('span[data-name="Updated"] time').attr('datetime');
										//console.log('status=', status);				
										//console.log('nickname=', nickName , 'value', value);
										//console.log('userName=', userName);

										if ((typeof(nickName) != "undefined") && (userName != '') && isStatisticIssues(new Date(d))) {
											if (users.has(nickName)) {
												if ($.inArray(value, users.get(nickName).issues) == -1) {
													users.get(nickName).issues.push(value);
												}
											} else {
												console.log('set ' + value + 'nick' + nickName);
												users.set(nickName, {
													name : userName,
													issues: [value],
													open: 0,
													inprogress: 0,
													resolved: 0,
												});
												var id = nickName.replace(/\./, '');
												$("#usersArea").append('<a href="javascript:void(0)" class="list-group-item" id="' + id + '">' + userName + '</a>');
											}					

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

										var workLogs = $(issuePage).find('#issue_actions_container').children('div[class="issue-data-block"]');

										$.each(workLogs, function(index, val) {
											var nickNameWokrlog = $(val).find('.action-details').find('a.user-avatar').attr('rel');
											var nameWorklog = $.trim($(val).find('.action-details').find('a.user-avatar').text());
											var date = $(val).find('.action-details').find('span.date').html();
											var issueDate = new Date(date);
											console.log('issueDate=', issueDate, 'isStatisticIssues=', isStatisticIssues(issueDate));
											if ((nickNameWokrlog != nickName) && (typeof(nickNameWokrlog) != "undefined") && isStatisticIssues(issueDate)) {
												if (users.has(nickNameWokrlog)) {
													if ($.inArray(value, users.get(nickNameWokrlog).issues) == -1) {
														users.get(nickNameWokrlog).issues.push(value);
													}
												} else {
													users.set(nickNameWokrlog, {
														name : nameWorklog,
														issues: [value],
														open: 0,
														inprogress: 0,
														resolved: 0,
													});
													var id = nickNameWokrlog.replace(/\./, '');
													$("#usersArea").append('<a href="javascript:void(0)" class="list-group-item" id="' + id + '">' + nameWorklog + '</a>');
												}
											}
										});
									},
									fail: function(data) {
										console.log("fail: ",data);
									}
								}));
							});
							$.when.apply($, promises).then(function() {
								displayUserProgress(users, countProjects);
								//console.log('$.when.apply $.when.apply $.when.apply');
							});
						}
					}));
				});
			},
			fail: function(data) {
				console.log("fail: ",data);
			}
		});
	});
}

var displayUserProgress = function(users, countProjects) {
	console.log('users ', users);
	currentProjectNumber++;
	var countAllIssues = 0;
	for (var nickName of users.keys()) {
		var countAllIssues = users.get(nickName).open + users.get(nickName).inprogress + users.get(nickName).resolved;

	    var openProgress = parseInt((users.get(nickName).open / countAllIssues) * 100);
		var inProgress = parseInt((users.get(nickName).inprogress / countAllIssues) * 100);
		var closedProgress = parseInt(100 - openProgress - inProgress);

		var taskOpenLabel = (users.get(nickName).open == 1) ? 'task' : 'tasks';
		var taskInProgressLabel = (users.get(nickName).inprogress == 1) ? 'task' : 'tasks';
		var taskClosedLabel = (users.get(nickName).resolved == 1) ? 'task' : 'tasks';
		
		var idNickname = nickName.replace(/\./, '');

		if ($("a#" + idNickname).children().length) {
			$.each($("a#" + idNickname).children(), function(index, value) {
				value.remove();
			});
		}

		if (currentProjectNumber == countProjects) {
			(function(nickName) {
				$("a#" + idNickname).click(function() {
					userDetail(nickName, userOpenCounter);
					return false;
				});
			})(nickName);
		}

		var img = '<img src="images/ajax-loader.gif" width="20"  height="20"/>';
		var loadingStr = ' Loading users\' projects: ' + currentProjectNumber + ' of ' + countProjects;
		loadingStr = (currentProjectNumber != countProjects) ? img + loadingStr : loadingStr; 
		$("#userUploading").html(loadingStr);

		if (countAllIssues) {
			$("a#" + idNickname).append($([
				'<div class="progress">',
					'<div class="progress-bar progress-bar-danger red-tooltip" role="progressbar" style="width:' + openProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + openProgress + '% / ' + users.get(nickName).open + ' ' + taskOpenLabel + '">Open</div>',
					'<div class="progress-bar progress-bar-warning red-tooltip" role="progressbar" style="width:' + inProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + inProgress + '% / ' + users.get(nickName).inprogress + ' ' + taskInProgressLabel + '">In Progress</div>',
					'<div class="progress-bar progress-bar-success red-tooltip" role="progressbar" style="width:' + closedProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + closedProgress + '% / ' + users.get(nickName).resolved + ' ' + taskClosedLabel + '">Done</div>',
				'</div>'].join(" ")
			));
		} else {
			$("a#" + idNickname).append($('<div class="progress">' + 
				'<div class="progress-bar progress-bar-info red-tooltip" role="progressbar" style="width:100%" data-toggle="tooltip" data-placement="bottom" title="Do not have assigned tasks">Do not have assigned tasks</div>' + 
				'</div>'
			));
		}		

		$('[data-toggle="tooltip"]').tooltip();		
	}
};

function addProjectProgress(result, issueType, data, projectKey, projectName) {
	var projectIssues = $(data).find("div.navigator-content").attr("data-issue-table-model-state");

	if (projectIssues.indexOf("\&quot;")) {
		projectIssues = projectIssues.split("\&quot;").join("\"");
	}
	projectIssues = $.parseJSON(projectIssues);

	console.log("after projectIssues=",projectIssues);

	result[issueType] = projectIssues.issueTable.end;

	//console.log(projectKey,"-",issueType,"=",projectIssues.issueTable.end);

	if (Object.keys(result).length == 6) {
		var countAllIssues = result.closed + result.resolved + result.inprogress + result.reopened + result.open + result.toDo;

		var toDoProgress = parseInt((result.toDo / countAllIssues) * 100);
		var openProgress = parseInt(((result.reopened + result.open) / countAllIssues) * 100);
		var inProgress = parseInt((result.inprogress / countAllIssues) * 100);
		var closedProgress = 100 - openProgress - inProgress - toDoProgress;

		var countToDoIssues = result.toDo;
		var countOpenIssues = result.reopened + result.open;
		var countInProgressIssues = result.inprogress;
		var countClosedIssues = result.closed + result.resolved;

		var taskToDoLabel = (countToDoIssues == 1) ? 'task' : 'tasks';
		var taskOpenLabel = (countOpenIssues == 1) ? 'task' : 'tasks';
		var taskInProgressLabel = (countInProgressIssues == 1) ? 'task' : 'tasks';
		var taskClosedLabel = (countClosedIssues == 1) ? 'task' : 'tasks';

		$("a#" + projectKey).append($([
			'<div class="progress">',
				'<div class="progress-bar progress-bar-info red-tooltip" role="progressbar" style="width:' + toDoProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + toDoProgress + '% / ' + countToDoIssues + ' ' + taskToDoLabel + '">To Do</div>',
				'<div class="progress-bar progress-bar-danger red-tooltip" role="progressbar" style="width:' + openProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + openProgress + '% / ' + countOpenIssues + ' ' + taskOpenLabel + '">Open</div>',
				'<div class="progress-bar progress-bar-warning red-tooltip" role="progressbar" style="width:' + inProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + inProgress + '% / ' + countInProgressIssues + ' ' + taskInProgressLabel + '">In Progress</div>',
				'<div class="progress-bar progress-bar-success red-tooltip" role="progressbar" style="width:' + closedProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + closedProgress + '% / ' + countClosedIssues + ' ' + taskClosedLabel + '">Done</div>',
			'</div>'].join(" ")
		));

		$('[data-toggle="tooltip"]').tooltip();
	}
}

function getProjects() {
	chrome.cookies.getAll({},function (cookie) {
		var result = [];
		var params = '';
		for (var i = 0; i < cookie.length; i++) {
			result.push({"name": cookie[i].name, "value": cookie[i].value});
			params += ';' + cookie[i].name + '=' + cookie[i].value;
		}

		params = params.substring(1);
		$.ajax({
			url: 'https://jira.codeswat.com/secure/BrowseProjects.jspa?selectedCategory=all',
			method: 'GET',
			headers: {
				'Cookie': params
			},
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			success: function(data) {
				//console.log('data -----', data);
				var startIndex = data.lastIndexOf('<tbody class="projects-list">');
				var endIndex = data.lastIndexOf('<footer id="footer" role="contentinfo">');
				var projectsCodeSwat = '<div><div><div><div><table>' + data.substring(startIndex, endIndex);
				var projectsParse = $(projectsCodeSwat).find('.projects-list').find('tr');
				var projects = [];
				var promises = [];
				$.each(projectsParse, function(index, value) {
					var name = $.trim($(value).find('[data-cell-type="name"]').text());
					var key = $.trim($(value).find('[data-cell-type="name"]').next().text());
					
					var project = $('<a href="javascript:void(0)" class="list-group-item" id="' + key + '" name="' + name + '">' + name + '</a>');
					projects.push(project);
					
					var issues = {};
					
					//To DO issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20AND%20status%20%3D%20"To%20Do"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {
								addProjectProgress(issues, 'toDo', projectData, key, name);
							}
						})
					);

					//Open issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20and%20status%20%3D%20"Open"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {						
								addProjectProgress(issues, 'open', projectData, key, name);
							}
						})
					);

					//Reopened issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20and%20status%20%3D%20"Reopened"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {
								addProjectProgress(issues, 'reopened', projectData, key, name);
							}
						})
					);

					//InProgress issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20and%20status%20%3D%20"In%20Progress"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {
								addProjectProgress(issues, 'inprogress', projectData, key, name);
							}
						})
					);


					//Closed issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20and%20status%20%3D%20"Closed"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {
								addProjectProgress(issues, 'closed', projectData, key, name);
							}
						})
					);

					//Resolved issues
					promises.push(
						$.ajax({
							url: 'https://jira.codeswat.com/browse/' + key + '-1?jql=project%20%3D%20"' + key + '"%20and%20status%20%3D%20"Resolved"',
							method: 'GET',
							headers: {
								'Cookie': params
							},
							success: function(projectData) {
								addProjectProgress(issues, 'resolved', projectData, key, name);
							}
						})
					);
				});
				$.when.apply($, promises).then(function() {
					console.log("when when when");
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
	});
}

