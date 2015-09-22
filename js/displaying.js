
function displayDetailsTabs(pName) {
	$("#mainView").hide();
	$("#details").show();
	$('#tasksUploading').show();

	$("#detail").find("div").html('<span>' + pName + '</span>');
};
function displayIssues(pName, pLog, pStatus, pIssueTag) {
	var style = 'info';
	switch (pStatus) {
		case "Open": 
		case "Reopened": {
			style = 'danger';
			break;
		}
		case "In Progress": {
			style = 'warning';
			break;
		}
		case "Closed":
		case "Resolved": {
			style = 'success';
			break;
		}
	}

	$("#" + pIssueTag).find('#defaultLabel').remove();
	$("#" + pIssueTag).append($([
		'<a href="#" class="list-group-item" id="' + pName + '">',
			pName,
			'<div class="progress">',
				'<div class="progress-bar progress-bar-' + style +'" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width:100%" data-toggle="tooltip" data-hours="' + pLog + '" data-placement="bottom" title="' + pStatus + '">' + pLog + ' h</div>',
			'</div>',
		'</a>'].join(' ')
	));

	$('[data-toggle="tooltip"]').tooltip();
};
function displayProjectProgress(pIssues, pProjectKey) {
	var countAllIssues = pIssues.closed + pIssues.resolved + pIssues.inprogress + pIssues.reopened + pIssues.open + pIssues.toDo;

	var toDoProgress = parseInt((pIssues.toDo / countAllIssues) * 100);
	var openProgress = parseInt(((pIssues.reopened + pIssues.open) / countAllIssues) * 100);
	var inProgress = parseInt((pIssues.inprogress / countAllIssues) * 100);
	var closedProgress = 100 - openProgress - inProgress - toDoProgress;

	var countToDoIssues = pIssues.toDo;
	var countOpenIssues = pIssues.reopened + pIssues.open;
	var countInProgressIssues = pIssues.inprogress;
	var countClosedIssues = pIssues.closed + pIssues.resolved;

	var taskToDoLabel = (countToDoIssues == 1) ? 'task' : 'tasks';
	var taskOpenLabel = (countOpenIssues == 1) ? 'task' : 'tasks';
	var taskInProgressLabel = (countInProgressIssues == 1) ? 'task' : 'tasks';
	var taskClosedLabel = (countClosedIssues == 1) ? 'task' : 'tasks';

	$("a#" + pProjectKey).append($([
		'<div class="progress">',
			'<div class="progress-bar progress-bar-info red-tooltip" role="progressbar" style="width:' + toDoProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + toDoProgress + '% / ' + countToDoIssues + ' ' + taskToDoLabel + '">To Do</div>',
			'<div class="progress-bar progress-bar-danger red-tooltip" role="progressbar" style="width:' + openProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + openProgress + '% / ' + countOpenIssues + ' ' + taskOpenLabel + '">Open</div>',
			'<div class="progress-bar progress-bar-warning red-tooltip" role="progressbar" style="width:' + inProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + inProgress + '% / ' + countInProgressIssues + ' ' + taskInProgressLabel + '">In Progress</div>',
			'<div class="progress-bar progress-bar-success red-tooltip" role="progressbar" style="width:' + closedProgress + '%" data-toggle="tooltip" data-placement="bottom" title="' + closedProgress + '% / ' + countClosedIssues + ' ' + taskClosedLabel + '">Done</div>',
		'</div>'].join(" ")
	));

	$('[data-toggle="tooltip"]').tooltip();
};
function displayUserProgress(users, countProjects) {
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
function displayTotal(pIssueTag) {
	if (! $("#" + pIssueTag).find('#defaultLabel').length) {
		var tasks = $("#" + pIssueTag).find('div.progress-bar');
		var totalTimeValue = 0;
		$.each(tasks, function(index, value){
			totalTimeValue += parseFloat($(value).attr('data-hours'));
		});
		$("#" + pIssueTag).append($([
			'<a href="#" class="list-group-item total">Total Time: ',
				totalTimeValue,
			' h</a>'].join(' ')
		));
	};	
};