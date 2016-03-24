$(function() {
    var valid_types = ['.py']
    var form = $('#uploadForm')
    var $fileInp = $('input[name=file]')
    var fillerCode = '# Enter code here'
    var $msg = $('.msg')

    //AceJS Code
    if (form.length) {
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.$blockScrolling = Infinity
        editor.getSession().setMode("ace/mode/python");
        editor.insert(fillerCode)

        //Event Handlers
        $fileInp.each(function() {
            var $label = $fileInp.next('label'),
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
                    for (var i = 0; i < files.length; i++) {
                        if (!files[i].name.endsWith('.py')) {
                            $msg.append('<p style="color:red;">Please upload valid filetypes</p>')
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
            if (!$nameInput.val()) {
                show_err('Please enter submission title', e)
            } else if (!$('input[name=user]').val()) {
                show_err('Please enter your name', e)
            }  else if ($fileInp.val() && (editor.getValue() != fillerCode || !editor.getValue())) {
                show_err('Can\'t accept submissions from both file(s) and text editor', e)
            } else if (!$fileInp.val() && (editor.getValue() == fillerCode || !editor.getValue())) {
                show_err('Please submit data', e)
            } else if (editor.getValue() != fillerCode) {
                e.preventDefault()
                var fd = new FormData(document.forms[0])
                var editor_file = new Blob([editor.getValue()], {type: 'text/x-script.python'})
                fd.append('file', editor_file, $nameInput.val()+'.py')
                // window.location.reload()
                $.ajax({
                    url: '/room/'+form.attr('room'),
                    method: 'post',
                    data: fd,
                    dataType: 'json',
                    processData: false,  // tell jQuery not to process the data
                    contentType: false   // tell jQuery not to set contentType
                }).then(function(data) {
                    console.log(data)
                    if (!data.success) data.success = 'Success'
                    $msg.append('<p style="color:green;">'+data.success+'</p>')
                }, function(data) {
                    console.log(data)
                    if (!data.responseJSON.error) data.responseJSON.error = 'Error'
                    $msg.append('<p style="color:red;">'+data.responseJSON.error+'</p>')
                })
                editor.setValue('')
                $(form).trigger('reset')
            }
        })

        function show_err(msg, e) {
            $msg.empty()
            $msg.append('<p>'+msg+'</p>')
            e.preventDefault()
        }
    } else {
        var $subContent = $('#subContent')
        var $probContent = $('#probContent')

        $subContent.find('.cross').click(function () {
            $msg.empty()
            var $parentElem = $(this).parents('tbody')
            var $index = $parentElem.find('i').index(this) + 1
            var $tableLink =$parentElem.find('tr:nth-child(' + $index + ') td:nth-child(1) a')
            var sub_name = $tableLink.text()

            axios.delete('/room/'+room_name+'/'+sub_name).then(function(res) {
                if (!res.data.success) res.data.success = 'Success'
                $msg.append('<p style="color:green;">'+res.data.success+'</p>')
                $parentElem.find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
            }, function(res) {
                if (!res.data.error) res.data.error = 'Error Occurred'
                $msg.append('<p style="color:green;">'+res.data.error+'</p>')
            })
        })

        $probContent.find('.cross').click(function() {
            $msg.empty()
            var $parentElem = $(this).parents('tbody')
            var $index = $parentElem.find('i').index(this) + 1
            var $tableLink = $parentElem.find('tr:nth-child(' + $index + ') td:nth-child(1) a')
            var prob_name = $tableLink.text()

            axios.delete('/problem/'+room_name, {
                data: {
                    problem: prob_name
                }
            }).then(function(res) {
                if (!res.data.success) res.data.success = 'Success'
                $msg.append('<p style="color:green;">'+res.data.success+'</p>')
                $parentElem.find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
            }, function(res) {
                if (!res.data.error) res.data.error = 'Error Occurred'
                $msg.append('<p style="color:green;">'+res.data.error+'</p>')
            })
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