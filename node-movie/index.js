const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const router = require("koa-router")();
const app = new Koa();
const Top250Model = require("./models/top250");
const cors = require("koa2-cors");
const koaBody = require('koa-body');
const path = require("path");
const static = require('koa-static');
const fs = require("fs");
router.get("/top250", async ctx => {
    var { start, limit } = ctx.query;
    if (start == undefined) {
        start = 0;
    }
    if (limit == undefined) {
        limit = 5
    }
    var data = await Top250Model.find().skip(Number(start)).limit(Number(limit));
    var total = await Top250Model.find().count();
    ctx.body = {
        code: 200,
        res: data,
        total,
        msg: "GET /top20  success"
    }

})


router.post("/collect", async ctx => {
        var id = ctx.request.body.id;
        var res = await Top250Model.updateOne({ _id: id }, { collected: true });
        if (res.nModified) {
            ctx.body = {
                code: 200,
                msg: "收藏成功"
            }

        } else {
            ctx.body = {
                code: 400,
                msg: "warning 已经收藏成功,不用重复收藏"
            }
        }
    })
    /* 取消收藏 */
router.post("/collect/cancel", async ctx => {
    var id = ctx.request.body.id;
    var res = await Top250Model.updateOne({ _id: id }, { collected: false });

    if (res.nModified) {
        ctx.body = {
            code: 200,
            msg: "取消收藏"
        }
    } else {
        ctx.body = {
            code: 400,
            msg: "warning 已经取消收藏,不比重复操作"
        }
    }
})
router.post("/delete", async ctx => {
    var id = ctx.request.body.id;
    var res = await Top250Model.deleteOne({ _id: id });
    console.log(res)
    if (res.deletedCount) {
        ctx.body = {
            code: 200,
            meg: "删除成功"
        }
    } else {
        ctx.body = {
            code: 400,
            msg: "删除成功,不比重复操作"
        }
    }
})
router.post("/doAdd", async ctx => {
    /* 那么这里可以取得文字相关的信息 */
    var { title, slogo, evaluate, rating, labels, collected } = ctx.request.body;
    const file = ctx.request.files.file
    const basename = path.basename(file.path)
        // 创建可读流
    const reader = fs.createReadStream(file.path);
    // 获取上传文件扩展名
    let filePath = process.cwd() + `/static/${basename}`;
    // 创建可写流
    const upStream = fs.createWriteStream(filePath);
    // 可读流通过管道写入可写流
    reader.pipe(upStream);
    // 将服务器上的图片地址存入数据库中
    var pic = `${ctx.origin}/${basename}`
    var data = new Top250Model({
        title,
        pic,
        slogo,
        evaluate,
        rating,
        labels,
        collected: Boolean(collected)
    })

    data.save(err => {
        if (err) {
            throw err
        };
    })

})
router.get("/detail", async ctx => {
    var id = ctx.request.query.id.trim();
    console.log(id);
    var data = await Top250Model.find({ _id: id });
    ctx.body = {
        code: 200,
        res: data[0],
        msg: "success  电影详情"
    }

})

app.use(bodyParser());
app.use(koaBody({
    // 支持文件格式
    multipart: true,
    formidable: {
        maxFileSize: 200 * 1024 * 1024,
        // 保留文件扩展名
        keepExtensions: true
    }
}));
app.use(static(`${process.cwd()}/static`));
app.use(cors());
app.use(router.routes());
app.listen(3000, () => {
    console.log("端口连接成功");
});