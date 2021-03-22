var priorities
var incidents
var token
var poller
var last_polled
var recent_log_entries = []
var recent_log_entries_purge_timer
var table
var current_font_size = 100

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

async function pdfetch(token, endpoint, params) {
    myParams = {...params}
    const endpoint_identifier = endpoint.split('/').pop()
    let r = []
    responses = await PagerDuty.all({token: token, endpoint: `/${endpoint}`, data: myParams})
    for (response of responses) {
        r = [...r, ...response.data[endpoint_identifier]]
    }
    return r
}

async function fetchIncidents(token, since, until) {
	var params = {
		since: since.toISOString(),
		until: until.toISOString(),
        'include[]': 'first_trigger_log_entries',
        'statuses[]': ['triggered', 'acknowledged', 'resolved']
	}
    console.log(`Getting incidents...`)
	const incidents = await pdfetch(token, 'incidents', params);
    console.log(`Getting alerts for ${incidents.length} incidents...`)
    for (const incident of incidents) {
        incident.alerts = await pdfetch(token, `incidents/${incident.id}/alerts`)
    }
    return incidents
}

function main() {
    console.log('hi')
    token = getParameterByName('token')
	$('#since').datepicker();
	$('#until').datepicker();

	var until = new Date();
	var since = new Date();
	since.setDate(since.getDate() - 7);

	since.setHours(0,0,0,0);
	until.setHours(23,59,59,999);

	$('#since').datepicker("setDate", since);
	$('#until').datepicker("setDate", until);

	// buildReport(since, until)

	$('#since').change(function() {
		since = $('#since').datepicker("getDate");
		since.setHours(0,0,0,0);

		// buildReport(since, until);
	});

	$('#until').change(function() {
		until = $('#until').datepicker("getDate");
		until.setHours(23,59,59,999);

		// buildReport(since, until);
    });
    fetchIncidents(token, since, until).then(incidents => {
        for (incident of incidents) {
            console.log(`Incident "${incident.title}" (${incident.id}) has ${incident.alerts.length} alerts`)
            for (const alert of incident.alerts) {
                console.log(`    ${alert.id}: ${alert.summary}`)
            }
        }
    })
}

$(main)