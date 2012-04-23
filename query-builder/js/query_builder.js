$(document).ready(function() {

// Keep all of our config options to this object
var config = (function () { 
    var my = {};
	
    my.request_location = 'http://dev.dp.la/v0.03/';
    
    my.item_options = {
    		'dpla.keyword' : 'Keyword',
    		'dpla.title' : 'Title',
    		'dpla.title_keyword' : 'Title Keyword',
    		'dpla.creator' : 'Creator',
    		'dpla.creator_keyword' : 'Creator Keyword',
    		'dpla.subject' : 'Subject Heading',
    		'dpla.subject_keyword' : 'Subject Heading Keyword',
    		'dpla.language': 'Language'
    };
    
    my.item_facet_options = {
    		'dpla.language' : 'Language',
    		'dpla.creator' : 'Creator',
    		'dpla.subject' : 'Subject Heading'
    };
    
    my.contributor_options = {
    		'dpla.keyword' : 'Keyword',
    		'dpla.name' : 'Name',
    		'dpla.state' : 'State',
    		'dpla.country' : 'Country',
    };

    my.contributor_facet_options = {
    		'dpla.type' : 'Contributor Type',
    		'dpla.location.address.state' : 'State',
    		'dpla.location.address.country' : 'Country',
    };
    
    return my; 
}());

// Anytime we draw to the screen, let's do it here
var view = (function () { 
    var my = {};
	
    // If we have a request for a direct resource, only draw the one direct resource box
	my.draw_direct = function() {
		var rows = '<div class="search_pair"><p>Direct access (enter a single ID)</p>';
		rows += '<div class="form_element"><input type="text" id="direct_access"/></div></div>';
		
		$('#dynamic_fields').html(rows);
	}
    
	// If we have a request for a search, draw all of the search boxes
	my.draw_search = function() {
		
		$('#access_type').val('search');
		
		// Buld the form DOM elements
		var option_string = '';
		var option_facet_string = '';
		if ($('#resource_type').val() == 'item') {
			$.each(config.item_options, function(k, v) {
				option_string += '<option value="' + k + '">' + v + '</option>';
			 });
			
		     $.each(config.item_facet_options, function(k, v) {
				option_facet_string += '<option value="' + k + '">' + v + '</option>';
			 });
		} else {
			$.each(config.contributor_options, function(k, v) {
				option_string += '<option value="' + k + '">' + v + '</option>';
			 });
			 
			 $.each(config.contributor_facet_options, function(k, v) {
				option_facet_string += '<option value="' + k + '">' + v + '</option>';
			 });
		}
		
		var rows = '<div class="search_pair"><p>Search</p>';
//		rows += '<div class="form_element"><select id="search_type">' + option_string + '</select></div></div>';
		rows += '<div class="form_element"><input type="text" id="search_type" value="dpla.keyword"/></div></div>';
		rows += '<div class="search_pair"><p>Query</p>';
		rows += '<div class="form_element"><input type="text" id="query" value="juneau"/></div></div>';
		rows += '<div class="search_pair"><p>Limit</p>';
		rows += '<div class="form_element"><input type="text" id="limit" value="5"/></div></div>';
		rows += '<div class="search_pair"><p>Facet</p>';
		rows += '<div class="form_element"><select id="facet" multiple="multiple">' + option_facet_string + '</select></div></div>';
		rows += '<div class="search_pair"><p>Filter</p>';
		rows += '<div class="filter_container"><div class="filter">';
		rows += '<div class="form_element"><select>' + option_string + '</select></div>';
		rows += '<div class="form_element"><input type="text"/></div>';
		rows += '</div></div>';
		rows += '<div class="add_filter">Add another filter</div></div>';
		$('#dynamic_fields').html(rows);
		
		// Our facet field is a multi-select. Let's mold it here:
		// Taken directly from http://abeautifulsite.net/blog/2008/04/jquery-multiselect/
		$("#facet").multiSelect({selectAll: true, });
	}
	
	
    return my; 
}());

// Build a query string form the fields, submit to the LC API and draw results
var exec_form = (function () { 
    var my = {};
    
    // Should produce something like 'http://localhost/librarycloud/v.2/api/item/'
    get_base = function() {
    	return config.request_location + $('#resource_type').val() + '/';
    }
    $
    
    // Makes the request and draws the results
    make_request = function(request_string) {
    	$('#lc_response').val( 'Waiting for a response from DPLA');

    	// Write a placeholder for the key (###)
    	$('#request').html(request_string);

		$.ajax({
		  url: request_string,
		  dataType: 'jsonp',
		  success: function(data) {
		  	$('#lc_response').val( FormatJSON(data, '  '));
		  },
		  error: function(data) {
  		  	$('#lc_response').val( 'Something went wonky. Is your request malformed?');
  		  }
		});
    }

    // If we have a search request, parse the fields here and build the query string
	exec_search = function() {
		var request_string = get_base();
		request_string += '?filter=' + $('#search_type').val();
		request_string += ':' + $('#query').val();
		request_string += '&limit=' + $('#limit').val();
		
		// Bulid list of facet params
		var facets = new Array();
		$('.checked').each(function(i, l){
		    if ($(l).find('input').val() != 'on') {
    			facets.push('facet=' + $(l).find('input').val());
    		}
		 });

		if (facets.length > 0) {
			var facet_string = facets.join('&');
			request_string += '&' + facet_string;
		}
		
		// Build list of filter params
		var filters = new Array();
		$('.filter').each(function(i, l){
			var filter_field = $(l).find('select option:selected').val();
			var filter_query = $(l).find('input').val();
			if (filter_field && filter_query) {
				filters.push('filter=' + filter_field + ':' + filter_query);
			}
		 });
		
		if (filters.length > 0) {
			var filter_string = filters.join('&');
			request_string += '&' + filter_string;
		}
				
		make_request(request_string);
		
	}

	// If we have a direct access request, parse the field here and build the query string
	exec_direct = function() {
		var request_string = get_base();
		request_string += $('#direct_access').val();
		
		make_request(request_string);
	}

	// Controller to provide one call into our draw method
	// In here we determine if we have a direct access or search request
	my.push_the_big_red_button = function() {
		switch ($('#access_type').val()) {
		case 'direct':
			exec_direct();
			break;
		case 'search':
			exec_search();
			break;
		}
	}
	
    return my; 
}());

// DOM Controls
// If someone switches something in the drop downs, redraw
$('#access_type,#resource_type').live('change', function() {
	switch ($('#access_type').val()) {
	case 'direct':
		view.draw_direct();
		break;
	case 'search':
		view.draw_search();
		break;
	}
});

// Allow users to add multiple filters
$('.add_filter').live('click', function(){
	$('.filter:first').clone().appendTo('.filter_container').find('input').val('');
	
});

// If the form is submitted
$('#submit_search').click(function(){
	exec_form.push_the_big_red_button();
	return false;
});

// Setup some defaults on first load
view.draw_search();
});
