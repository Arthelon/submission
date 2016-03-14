$(function() {
    var valid_types = ['.py']
    var form = $('#uploadForm')
    var $fileInp = $('input[name=file]')
    var fillerCode = '# Enter code here'

    //AceJS Code
    if (form.length) {
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.$blockScrolling = Infinity
        editor.getSession().setMode("ace/mode/python");
        editor.insert(fillerCode)

        //Event Handlers
        $fileInp.each(function() {
            var $label	 = $fileInp.next('label'),
                labelVal = $label.html();

            $fileInp.on('change', function(e) {
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
                            $fileInp.val('')
                        }
                    }
                }
            });
            // Firefox bug fix
            $fileInp
                .on( 'focus', function(){ $fileInp.addClass( 'has-focus' ); })
                .on( 'blur', function(){ $fileInp.removeClass( 'has-focus' ); });
        });

        $('button[type=submit]').on('click', function(e) {
            console.log($fileInp.val())
            if (!$('input[name=name]').val()) {
                show_err('Please enter submission title', e)
            } else if ($fileInp.val() && editor.getValue() == fillerCode) {
                show_err('Can\'t accept submissions from both file(s) and text editor', e)
            } else if (!$fileInp.val() && editor.getValue() == fillerCode) {
                show_err('Please submit data', e)
            } else if (editor.getValue() != fillerCode) {
                e.preventDefault()
                var fd = new FormData(document.forms[0]);
                var editor_file = new Blob(editor.getValue().split('\n'), {type: 'text/x-script.python'})
                fd.append('file', editor_file, $('input[name=name]').val()+'.py')
                $.ajax({
                    url: '/room/'+form.attr('room'),
                    method: 'post',
                    data: fd,
                    processData: false,  // tell jQuery not to process the data
                    contentType: false   // tell jQuery not to set contentType
                })
            }
        })

        function show_err(msg, e) {
            form.find('.errors').empty()
            form.find('.errors').append('<p>'+msg+'</p>')
            e.preventDefault()
        }
    } else {
        var $subContent = $('#subContent')
        var $probContent = $('#probContent')

        $subContent.find('.cross').click(function () {
            var $index = $(this).index() + 1
            var $tableLink = $('tbody tr:nth-child(' + $index + ') td:nth-child(1) a')
            var sub_name = $tableLink.text()

            $.ajax({
                type: "DELETE",
                url: '/room/_remove_sub/',
                dataType: 'json',
                data: {
                    room_name: room_name,
                    sub_name: sub_name
                }
            });
            $('tbody tr:nth-child(' + $index + ')').remove()
        })
    }

    $('.nav > li').click(function() {
        $(this).attr('class', 'active')
        if ($(this).index() != 0) {
            $('.nav > li:nth-child(1)').attr('class', '')
            $subContent.fadeOut(500, function() {
                $probContent.fadeIn(300)
            })
        } else {
            $('.nav > li:nth-child(2)').attr('class', '')
            $probContent.fadeOut(500, function() {
                $subContent.fadeIn(300)
            })
        }
    })
})