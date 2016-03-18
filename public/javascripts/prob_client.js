$(function() {
    $('.cross').click(function() {
        var $index = $('i').index(this) + 1
        var $tableLink = $(this).parents('tbody').find('tr:nth-child(' + $index + ') td:nth-child(1) a')
        var sub_name = $tableLink.text()

        $.ajax({
            type: "DELETE",
            url: '/room/'+room_name+'/'+sub_name,
        });
        $(this).parents('tbody').find('tr:nth-child(' + $index + ')').fadeOut(400, () => $(this).remove())
    })
    var $subContent = $('#subContent')
    var $testContent = $('#testContent')
    var $createContent = $('#createContent')

    $('.nav > li').click(function() {
        $(this).attr('class', 'active')
        $createContent.fadeOut(500, () => {
            if ($(this).index() != 0) {
                $('.nav > li:nth-child(1)').attr('class', '')
                $subContent.fadeOut(500, function() {
                    $testContent.fadeIn(300)
                })
            } else {
                $('.nav > li:nth-child(2)').attr('class', '')
                $testContent.fadeOut(500, function() {
                    $subContent.fadeIn(300)
                })
            }
        })
    })

    $('#createTest').click(function() {
        $testContent.fadeOut(500, function() {
            $createContent.fadeIn(300)
        })
    })
})