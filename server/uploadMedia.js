import formidable from "formidable";
import fs from "fs";

export default function () {
    return new Promise((resolve) => {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            let picture = fields.myFile.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer.from(picture, 'base64');
            let id = uuidv4();
            fs.writeFile(`uploads/${id}.png`, buf, function (err) {
                if (err) return console.log(err);
                return { files: files, fields: fields };
            });

        });
    })

}