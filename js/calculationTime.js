function calcTimeWorkLog(time) {
	var result = 0;
	
	$.each(time.split(','), function(index, value) {
		value = value.replace(/\s/gi,'');
		if (value.length > 9) {
			return 0;
		} else if (value.indexOf('week') != -1) {
			result += parseInt(value.match(/\d+/)[0]) * 40;
		}
		else if (value.indexOf('day') != -1) {
			result += parseInt(value.match(/\d+/)[0]) * 8;
		}
		else if (value.indexOf('hour') != -1) {
			result += parseInt(value.match(/\d+/)[0]);
		}
		else if (value.indexOf('minute') != -1) {
			result += parseInt(value.match(/\d+/)[0]) / 60;
		}
	});

	return result;
}

function calcTime(time) {
	var result = 0;
	$.each(time.split(' '), function(index, value) {
		//console.log(value);
		if (value.length > 3) {
			return 0;
		} else if (value.indexOf('w') != -1) {
			result += parseInt(value.match('/\d+/')[0]) * 40;
		}
		else if (value.indexOf('d') != -1) {
			result += parseInt(value.match(/\d+/)[0]) * 8;
		}
		else if (value.indexOf('h') != -1) {
			result += parseInt(value.match(/\d+/)[0]);
		}
		else if (value.indexOf('m') != -1) {
			result += parseInt(value.match(/\d+/)[0]) / 60;
		}
	});

	return result;
}
