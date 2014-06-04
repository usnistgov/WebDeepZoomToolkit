// Allows to insert html in a dialog's title
// Taken from http://stackoverflow.com/questions/14488774/using-html-in-a-dialogs-title-in-jquery-ui-1-10
$.widget("ui.dialogHtmlTitle", $.extend({}, $.ui.dialog.prototype, {
    _title: function(title) {
        if (!this.options.title) {
            title.html("&#160;");
        } else {
            title.html(this.options.title);
        }
    }
}));
