var moment = require('moment')

var DateFormatter = {

  /**
   * Formats the string of the date of a note for the note thumbnail
   * 
   * Takes a raw date string e.g. created by Date.now()
   * 
   * @param {Date()} date
   */
  formatDateNoteThmb: function(date){
    let now = moment(new Date())
    let today = moment(now.format("DD-MM-YYYY"), "DD-MM-YYYY")
    let n_date = moment(new Date(date))
    let diff = today.diff(n_date, 'days', true)
    
    if(diff <= 0){
      return n_date.format("HH:MM")
    }else if(diff <= 1){
      return "Yesterday"
    }else if(diff <= 2){
      return n_date.format("dddd")
    }else if(diff <= 3){
      return n_date.format("dddd")
    }else if(diff <= 4){
      return n_date.format("dddd")
    }else if(diff <= 5){
      return n_date.format("dddd")
    }else if(diff <= 6){
      return n_date.format("dddd")
    }else{
      return n_date.format("DD.MM.YY")
    }
  },

  /**
   * Formats the string of the date of a note for the note thumbnail
   * 
   * Takes a raw date string e.g. created by Date.now()
   * 
   * @param {Date()} date
   */
  formatDateEditor: function(date){
    // Always show date in format as such 8. January 2021 at 14:56
    let m = moment(new Date(date))
    let d_str = m.format("DD. MMMM YYYY")
    let t_str = m.format("HH:MM")
    return d_str + " at " + t_str
  }
}

module.exports = DateFormatter
