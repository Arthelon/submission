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
        var $nameInput = $('input[name=name]')
        $('button[type=submit]').on('click', function(e) {
            console.log('clicked')
            if (!$nameInput.val()) {
                show_err('Please enter submission title', e)
            } else if (!$('input[name=user]').val()) {
                show_err('Please enter your name', e)
            }  else if ($fileInp.val() && editor.getValue() == fillerCode) {
                show_err('Can\'t accept submissions from both file(s) and text editor', e)
            } else if (!$fileInp.val() && editor.getValue() == fillerCode) {
                show_err('Please submit data', e)
            } else if (editor.getValue() != fillerCode) {
                e.preventDefault()
                var fd = new FormData(document.forms[0])
                var editor_file = new Blob([editor.getValue()], {type: 'text/x-script.python'})
                fd.append('file', editor_file, $nameInput.val()+'.py')
                $.ajax({
                    url: '/room/'+form.attr('room'),
                    method: 'post',
                    data: fd,
                    processData: false,  // tell jQuery not to process the data
                    contentType: false   // tell jQuery not to set contentType
                })
                location.reload()
            }
        })

        function show_err(msg, e) {
            var $errors = $('.errors')
            $errors.empty()
            $errors.append('<p>'+msg+'</p>')
            e.preventDefault()
        }
    } else {
        var $subContent = $('#subContent')
        var $probContent = $('#probContent')
        $subContent.find('.cross').click(function () {
            var $parentElem = $(this).parents('tbody')
            var $index = $parentElem.find('i').index(this) + 1
            var $tableLink =$parentElem.find('tr:nth-child(' + $index + ') td:nth-child(1) a')
            var sub_name = $tableLink.text()

            $.ajax({
                type: "DELETE",
                url: '/room/'+room_name+'/'+sub_name
            });
            $parentElem.find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
        })

        $probContent.find('.cross').click(function() {
            var $parentElem = $(this).parents('tbody')
            var $index = $parentElem.find('i').index(this) + 1
            var $tableLink = $parentElem.find('tr:nth-child(' + $index + ') td:nth-child(1) a')
            var prob_name = $tableLink.text()
            $.ajax({
                type: "DELETE",
                url: '/problem/'+room_name+'/'+prob_name
            });
            $parentElem.find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())

        })

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
    }
})