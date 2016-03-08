$(function() {
    var valid_types = ['.py']
    var input_elem = $('input[name=file]')

    input_elem.change(function() {
        if (this.files) {
            var file = this.files[0]
            if (!file.name.endsWith('.py')) {
                $('#uploadForm').find('.errors').append('<p>Please upload a valid filetype</p>')
                input_elem.wrap('<form>').closest('form').get(0).reset();
                input_elem.unwrap();

                // Prevent form submission
                //input_elem.stopPropagation();
                //input_elem.preventDefault();
            } else {
                $('#uploadForm').find('.errors').empty()
            }
        }
    })
})