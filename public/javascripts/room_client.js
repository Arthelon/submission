$(function() {
    var valid_types = ['.py']
    var form = $('#uploadForm')

    $('input[name=file]').each( function() {
        var $input	 = $(this),
            $label	 = $input.next('label'),
            labelVal = $label.html();

        $input.on('change', function(e) {
            var fileName = '';

            form.find('.errors').empty()

            if(this.files && this.files.length > 1 )
                fileName = (this.getAttribute('data-multiple-caption') || '' ).replace( '{count}', this.files.length );
            else if( e.target.value )
                fileName = e.target.value.split( '\\' ).pop();

            if(fileName)
                $label.find('span').html( fileName );
            else
                $label.html(labelVal);
            if (this.files) {
                var files = this.files
                for (var i in files) {
                    if (files[i] && !files[i].name.endsWith('.py')) {
                        form.find('.errors').append('<p>Please upload valid filetypes</p>')
                        $input.val('')
                    }
                }
            }
        });
        // Firefox bug fix
        $input
            .on( 'focus', function(){ $input.addClass( 'has-focus' ); })
            .on( 'blur', function(){ $input.removeClass( 'has-focus' ); });
    });

    $('input[type=submit]').click(function(e) {
        if (!$('input[name=file]').val()) {
            form.find('.errors').empty()
            form.find('.errors').append('<p>No files selected</p>')
            e.preventDefault()
        } else if (!$('input[name=name]').val()) {
            form.find('.errors').empty()
            form.find('.errors').append('<p>Please enter a submission title</p>')
            e.preventDefault()
        }
    })

    $('.cross').click(function() {
        var $index = $(this).index()+1
        var $tableLink = $('tbody tr:nth-child('+$index+') td:nth-child(1) a')
        var room_name = $tableLink.attr('room')
        var sub_name = $tableLink.text()

        $.ajax({
            type: "DELETE",
            url: '/room/'+room_name+'/_remove_sub/'+sub_name
        });
        $('tbody tr:nth-child('+$index+')').remove()
    })
})